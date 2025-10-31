<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Permission;
use Exception;
use Spatie\Activitylog\Models\Activity;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Permission::query();

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('guard_name', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column
        $allowedSorts = ['name', 'guard_name', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $permissions = $query->paginate(20);

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
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
            if ($request->has('search') && !empty($request->input('search'))) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('guard_name', 'like', "%{$search}%");
                });
            }

            if ($request->has('sort')) {
                $sort = $request->input('sort', 'name');
                $direction = $request->input('direction', 'asc');
                $query->orderBy($sort, $direction);
            }

            $permissions = $query->get();

            // Generate CSV
            $filename = 'permissions_' . now()->format('Y-m-d_H-i-s') . '.csv';
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
                    $permission->updated_at
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
