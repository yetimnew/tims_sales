<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $perPageOptions = [10, 15, 25, 50];

        $search = trim((string) $request->input('search', ''));
        $module = trim((string) $request->input('module', ''));

        $query = Permission::query();

        // Handle search
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('guard_name', 'like', "%{$search}%");
            });
        }

        if ($module !== '' && $module !== 'all') {
            $query->where(function ($builder) use ($module) {
                $builder->where('name', 'like', "{$module}.%")
                    ->orWhere('name', $module);
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column
        $allowedSorts = ['name', 'guard_name', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $query->orderBy($sort, $direction);

        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 15;
        }

        $permissions = $query
            ->paginate($perPage)
            ->withQueryString();

        // Cache module options (1 hour) - changes when permissions are added/removed
        $moduleOptions = Cache::remember('permissions.module_options', 3600, function () {
            return Permission::query()
                ->select('name')
                ->get()
                ->map(static function (Permission $permission): string {
                    if (Str::contains($permission->name, '.')) {
                        return (string) Str::before($permission->name, '.');
                    }

                    return $permission->name;
                })
                ->filter(static fn ($group) => $group !== null && $group !== '')
                ->unique()
                ->sort()
                ->values()
                ->map(static fn ($group) => [
                    'label' => Str::headline((string) $group),
                    'value' => (string) $group,
                ])
                ->all();
        });

        $filters = [
            'search' => $search !== '' ? $search : null,
            'module' => $module !== '' ? $module : null,
            'sort' => $sort,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'filters' => $filters,
            'moduleOptions' => $moduleOptions,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Permission $permission): Response
    {
        // Load roles that have this permission
        $roles = \Spatie\Permission\Models\Role::whereHas('permissions', function ($query) use ($permission) {
            $query->where('permissions.id', $permission->id);
        })->get();

        // Load activity logs
        $activityLogs = Activity::forSubject($permission)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Permissions/Show', [
            'permission' => $permission,
            'roles' => $roles,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Export permissions to CSV.
     */
    public function export(Request $request)
    {
        try {
            $query = Permission::query();

            // Apply same search and sort as index
            if ($request->has('search') && ! empty($request->input('search'))) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('guard_name', 'like', "%{$search}%");
                });
            }

            $module = trim((string) $request->input('module', ''));
            if ($module !== '' && $module !== 'all') {
                $query->where(function ($builder) use ($module) {
                    $builder->where('name', 'like', "{$module}.%")
                        ->orWhere('name', $module);
                });
            }

            if ($request->has('sort')) {
                $sort = $request->input('sort', 'name');
                $direction = $request->input('direction', 'asc');
                $query->orderBy($sort, $direction);
            }

            $permissions = $query->get();

            // Generate CSV
            $filename = 'permissions_'.now()->format('Y-m-d_H-i-s').'.csv';
            $handle = fopen('php://temp', 'r+');

            // Write header
            fputcsv($handle, ['ID', 'Name', 'Guard', 'Created At', 'Updated At']);

            // Write data
            foreach ($permissions as $permission) {
                fputcsv($handle, [
                    $permission->id,
                    $permission->name,
                    $permission->guard_name,
                    $permission->created_at,
                    $permission->updated_at,
                ]);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            // Log activity
            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['count' => count($permissions)])
                    ->log('exported permissions to CSV');
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', "attachment; filename=\"$filename\"");
        } catch (Exception $e) {
            Log::error('Permission export failed', [
                'error' => $e->getMessage(),
                'exported_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to export permissions. Please try again.']);
        }
    }
}
