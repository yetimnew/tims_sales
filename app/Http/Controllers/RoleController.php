<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Exception;
use Spatie\Activitylog\Models\Activity;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Role::with('permissions');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column
        $allowedSorts = ['name', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $roles = $query->paginate(15);

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'permissions' => 'nullable|array',
                'permissions.*' => 'exists:permissions,id',
            ]);

            $role = Role::create(['name' => $validated['name']]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }

            // Log activity
            activity()
                ->performedOn($role)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $role->name,
                    'permissions_count' => count($validated['permissions'] ?? []),
                ])
                ->log('Role created');

            Log::info('Role created', [
                'role_id' => $role->id,
                'name' => $role->name,
                'created_by' => Auth::id(),
            ]);

            return redirect()->route('roles.index')
                ->with('success', 'Role created successfully.');

        } catch (Exception $e) {
            Log::error('Role creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'created_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create role. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role): Response
    {
        $role->load('permissions');

        // Load activity logs
        $activityLogs = Activity::forSubject($role)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Roles/Show', [
            'role' => $role,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role): Response
    {
        $role->load('permissions');
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
                'permissions' => 'nullable|array',
                'permissions.*' => 'exists:permissions,id',
            ]);

            $oldPermissions = $role->permissions->pluck('id')->toArray();
            $newPermissions = $validated['permissions'] ?? [];

            $role->update(['name' => $validated['name']]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }

            // Log activity
            activity()
                ->performedOn($role)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $role->name,
                    'old_permissions' => $oldPermissions,
                    'new_permissions' => $newPermissions,
                ])
                ->log('Role updated');

            Log::info('Role updated', [
                'role_id' => $role->id,
                'name' => $role->name,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->route('roles.index')
                ->with('success', 'Role updated successfully.');

        } catch (Exception $e) {
            Log::error('Role update failed', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'updated_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update role. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        try {
            // Prevent deletion of system roles
            if (in_array($role->name, ['admin', 'manager', 'user'])) {
                return back()->withErrors(['error' => 'System roles cannot be deleted.']);
            }

            $roleData = $role->toArray();
            $rolePermissions = $role->permissions->pluck('name')->toArray();

            // Log activity before deletion
            activity()
                ->performedOn($role)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $role->name,
                    'permissions' => $rolePermissions,
                ])
                ->log('Role deleted');

            $role->delete();

            Log::info('Role deleted', [
                'role_id' => $role->id,
                'name' => $roleData['name'],
                'permissions' => $rolePermissions,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->route('roles.index')
                ->with('success', 'Role deleted successfully.');

        } catch (Exception $e) {
            Log::error('Role deletion failed', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'deleted_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete role. Please try again.']);
        }
    }

    /**
     * Export roles to CSV.
     */
    public function export(Request $request)
    {
        try {
            $query = Role::with('permissions');

            // Apply same search and sort as index
            if ($request->has('search') && !empty($request->input('search'))) {
                $search = $request->input('search');
                $query->where('name', 'like', "%{$search}%");
            }

            if ($request->has('sort')) {
                $sort = $request->input('sort', 'name');
                $direction = $request->input('direction', 'asc');
                $query->orderBy($sort, $direction);
            }

            $roles = $query->get();

            // Generate CSV
            $filename = 'roles_' . now()->format('Y-m-d_H-i-s') . '.csv';
            $handle = fopen('php://temp', 'r+');

            // Write header
            fputcsv($handle, ['ID', 'Name', 'Guard', 'Permissions', 'Created At', 'Updated At']);

            // Write data
            foreach ($roles as $role) {
                fputcsv($handle, [
                    $role->id,
                    $role->name,
                    $role->guard_name,
                    $role->permissions->pluck('name')->join(', '),
                    $role->created_at,
                    $role->updated_at
                ]);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            // Log activity
            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['count' => count($roles)])
                    ->log('exported roles to CSV');
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', "attachment; filename=\"$filename\"");
        } catch (Exception $e) {
            Log::error('Role export failed', [
                'error' => $e->getMessage(),
                'exported_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to export roles. Please try again.']);
        }
    }
}
