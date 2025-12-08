<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CheckPermissionSeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $permissionDependencies = [];

    public function run(): void
    {
        // ==================== TRUCKS PERMISSIONS ====================
        $truckPermissions = [
            'trucks.view', 'trucks.show', 'trucks.create', 'trucks.store', 'trucks.edit',
            'trucks.update', 'trucks.deactivate', 'trucks.activate', 'trucks.destroy',
        ];

        // ==================== DRIVER TRUCK ASSIGNMENTS PERMISSIONS ====================
        $driverTruckPermissions = [
            'driver-trucks.view', 'driver-trucks.show', 'driver-trucks.create', 'driver-trucks.store',
            'driver-trucks.edit', 'driver-trucks.update', 'driver-trucks.destroy', 'driver-trucks.detach',
        ];

        // ==================== DRIVERS PERMISSIONS ====================
        $driverPermissions = [
            'drivers.view', 'drivers.show', 'drivers.create', 'drivers.store', 'drivers.edit',
            'drivers.update', 'drivers.destroy', 'drivers.deactivate', 'drivers.activate',
        ];

        // ==================== MAINTENANCE PERMISSIONS ====================
        $maintenancePermissions = [
            'maintenance.view', 'maintenance.show', 'maintenance.create', 'maintenance.store', 'maintenance.edit',
            'maintenance.update', 'maintenance.destroy', 'maintenance.complete',
        ];

        // ==================== MAINTENANCE TYPE PERMISSIONS ====================
        $maintenanceTypePermissions = [
            'maintenance-types.view', 'maintenance-types.show', 'maintenance-types.create', 'maintenance-types.store',
            'maintenance-types.edit', 'maintenance-types.update', 'maintenance-types.destroy',
        ];

        // ==================== VEHICLE TYPE PERMISSIONS ====================
        $vehicleTypePermissions = [
            'vehicletypes.view', 'vehicletypes.show', 'vehicletypes.create', 'vehicletypes.store',
            'vehicletypes.edit', 'vehicletypes.update', 'vehicletypes.destroy',
        ];

        // ==================== FUEL PERMISSIONS ====================
        $fuelPermissions = [
            'fuel.view', 'fuel.show', 'fuel.create', 'fuel.store', 'fuel.edit',
            'fuel.update', 'fuel.destroy', 'fuel.analysis',
        ];

        // ==================== FINANCIAL PERMISSIONS ====================
        $financialPermissions = [
            'financial.view', 'financial.show', 'financial.create', 'financial.store', 'financial.edit',
            'financial.update', 'financial.destroy', 'financial.analytics',
        ];

        // ==================== CARGO TYPE PERMISSIONS ====================
        $cargoTypePermissions = [
            'cargotypes.view', 'cargotypes.show', 'cargotypes.create', 'cargotypes.store',
            'cargotypes.edit', 'cargotypes.update', 'cargotypes.destroy', 'cargotypes.export',
        ];

        // ==================== REGION PERMISSIONS ====================
        $regionPermissions = [
            'regions.view', 'regions.show', 'regions.create', 'regions.store',
            'regions.edit', 'regions.update', 'regions.destroy',
        ];

        // ==================== ZONE PERMISSIONS ====================
        $zonePermissions = [
            'zones.view', 'zones.show', 'zones.create', 'zones.store',
            'zones.edit', 'zones.update', 'zones.destroy',
        ];

        // ==================== WOREDA PERMISSIONS ====================
        $woredaPermissions = [
            'woredas.view', 'woredas.show', 'woredas.create', 'woredas.store',
            'woredas.edit', 'woredas.update', 'woredas.destroy',
        ];

        // ==================== PLACE PERMISSIONS ====================
        $placePermissions = [
            'places.view', 'places.show', 'places.create', 'places.store',
            'places.edit', 'places.update', 'places.destroy',
        ];

        // ==================== STATUS TYPE PERMISSIONS ====================
        $statusTypePermissions = [
            'statustypes.view', 'statustypes.show', 'statustypes.create', 'statustypes.store',
            'statustypes.edit', 'statustypes.update', 'statustypes.destroy', 'statustypes.export',
        ];

        // ==================== STATUS PERMISSIONS ====================
        $statusPermissions = [
            'statuses.view', 'statuses.show', 'statuses.create', 'statuses.store',
            'statuses.edit', 'statuses.update', 'statuses.destroy', 'statuses.export',
        ];

        // ==================== TRUCK STATUS BOARD PERMISSIONS ====================
        $truckStatusBoardPermissions = [
            'truck-status-board.view', 'truck-status-board.update',
        ];

        // ==================== OPERATION PERMISSIONS ====================
        $operationPermissions = [
            'operations.view', 'operations.show', 'operations.create', 'operations.store',
            'operations.edit', 'operations.update', 'operations.destroy',
            'operations.deactivate', 'operations.available',
        ];

        // ==================== CUSTOMER PERMISSIONS ====================
        $customerPermissions = [
            'customers.view', 'customers.show', 'customers.create', 'customers.store',
            'customers.edit', 'customers.update', 'customers.destroy',
            'customers.deactivate', 'customers.active',
        ];

        // ==================== REGION PERMISSIONS ====================
        $regionPermissions = [
            'regions.view', 'regions.show', 'regions.create', 'regions.store',
            'regions.edit', 'regions.update', 'regions.destroy',
            'regions.deactivate', 'regions.active',
        ];

        // ==================== ZONE PERMISSIONS ====================
        $zonePermissions = [
            'zones.view', 'zones.show', 'zones.create', 'zones.store',
            'zones.edit', 'zones.update', 'zones.destroy',
            'zones.deactivate', 'zones.active',
        ];

        // ==================== WOREDA PERMISSIONS ====================
        $woredaPermissions = [
            'woredas.view', 'woredas.show', 'woredas.create', 'woredas.store',
            'woredas.edit', 'woredas.update', 'woredas.destroy',
            'woredas.deactivate', 'woredas.active',
        ];

        // ==================== PLACE PERMISSIONS ====================
        $placePermissions = [
            'places.view', 'places.show', 'places.create', 'places.store',
            'places.edit', 'places.update', 'places.destroy',
            'places.deactivate', 'places.active',
        ];

        // ==================== DISTANCE PERMISSIONS ====================
        $distancePermissions = [
            'distances.view', 'distances.show', 'distances.create', 'distances.store',
            'distances.edit', 'distances.update', 'distances.destroy',
            'distances.deactivate', 'distances.active',
        ];

        // ==================== PERFORMANCE PERMISSIONS ====================
        $performancePermissions = [
            'performances.view', 'performances.show', 'performances.view-own', 'performances.view-any', 'performances.create', 'performances.store',
            'performances.edit', 'performances.update', 'performances.destroy',
            'performances.deactivate', 'performances.active',
        ];

        // ==================== DRIVER PERFORMANCE PERMISSIONS ====================
        $driverPerformancePermissions = [
            'driver-performance.view', 'driver-performance.show', 'driver-performance.create', 'driver-performance.store',
            'driver-performance.edit', 'driver-performance.update', 'driver-performance.destroy', 'driver-performance.export',
        ];

        // ==================== DRIVER SAFETY PERMISSIONS ====================
        $driverSafetyPermissions = [
            'driver-safety.view', 'driver-safety.show', 'driver-safety.create', 'driver-safety.store',
            'driver-safety.edit', 'driver-safety.update', 'driver-safety.destroy', 'driver-safety.export',
        ];

        // ==================== ROUTE PLAN PERMISSIONS ====================
        $routePlanPermissions = [
            'route-plans.view', 'route-plans.show', 'route-plans.create', 'route-plans.store',
            'route-plans.edit', 'route-plans.update', 'route-plans.destroy', 'route-plans.export',
        ];

        // ==================== OUTSOURCE PERMISSIONS ====================
        $outsourcePermissions = [
            'outsources.view', 'outsources.show', 'outsources.create', 'outsources.store',
            'outsources.edit', 'outsources.update', 'outsources.destroy', 'outsources.export',
        ];

        // ==================== OUTSOURCE PERFORMANCE PERMISSIONS ====================
        $outsourcePerformancePermissions = [
            'outsource-performances.view', 'outsource-performances.show', 'outsource-performances.view-own', 'outsource-performances.view-any',
            'outsource-performances.create', 'outsource-performances.store', 'outsource-performances.edit', 'outsource-performances.update',
            'outsource-performances.destroy',
        ];

        // ==================== USER MANAGEMENT PERMISSIONS ====================
        $userPermissions = [
            'users.view', 'users.show', 'users.create', 'users.store',
            'users.edit', 'users.update', 'users.destroy', 'users.export',
        ];

        // ==================== ROLE MANAGEMENT PERMISSIONS ====================
        $rolePermissions = [
            'roles.view', 'roles.show', 'roles.create', 'roles.store',
            'roles.edit', 'roles.update', 'roles.destroy', 'roles.export',
        ];

        // ==================== PERMISSION MANAGEMENT PERMISSIONS ====================
        $permissionPermissions = [
            'permissions.view', 'permissions.show', 'permissions.export',
        ];

        // ==================== ACTIVITY LOG PERMISSIONS ====================
        $activityLogPermissions = [
            'activity-logs.view', 'activity-logs.show', 'activity-logs.export',
        ];

        // ==================== TELESCOPE PERMISSIONS ====================
        $telescopePermissions = [
            'view telescope',
        ];

        // ==================== COMBINE ALL PERMISSIONS ====================
        $allPermissions = array_merge(
            $truckPermissions,
            $driverTruckPermissions,
            $driverPermissions,
            $maintenancePermissions,
            $maintenanceTypePermissions,
            $vehicleTypePermissions,
            $fuelPermissions,
            $financialPermissions,
            $cargoTypePermissions,
            $regionPermissions,
            $zonePermissions,
            $woredaPermissions,
            $placePermissions,
            $statusTypePermissions,
            $statusPermissions,
            $truckStatusBoardPermissions,
            $operationPermissions,
            $customerPermissions,
            $distancePermissions,
            $performancePermissions,
            $driverPerformancePermissions,
            $driverSafetyPermissions,
            $routePlanPermissions,
            $outsourcePermissions,
            $outsourcePerformancePermissions,
            $userPermissions,
            $rolePermissions,
            $permissionPermissions,
            $activityLogPermissions,
            $telescopePermissions
        );

        // Create all permissions
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // ==================== ROLES CONFIGURATION ====================

        $this->buildPermissionDependencies($allPermissions);

        // ADMIN: All permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions($allPermissions);
        $this->applyPermissionDependenciesToRole($adminRole);

        // MANAGER: All except destroy
        $managerPermissions = array_filter(
            $allPermissions,
            fn ($permission) => ! str_contains($permission, '.destroy')
        );
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $managerRole->syncPermissions($managerPermissions);
        $this->applyPermissionDependenciesToRole($managerRole);

        // USER: Only view, show, export
        $userPermissions = array_filter(
            $allPermissions,
            fn ($permission) => (str_contains($permission, '.view') && ! str_contains($permission, '.view-any'))
                               || str_contains($permission, '.show')
                               || str_contains($permission, '.export')
        );
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $userRole->syncPermissions($userPermissions);
        $this->applyPermissionDependenciesToRole($userRole);

        // Ensure any existing users or roles pick up required dependencies
        Role::with('permissions')->get()->each(function (Role $role): void {
            $this->applyPermissionDependenciesToRole($role);
        });

        User::query()
            ->with('permissions')
            ->chunkById(200, function ($users): void {
                $users->each(function (User $user): void {
                    $this->applyPermissionDependenciesToUser($user);
                });
            });
    }

    private function applyPermissionDependenciesToRole(Role $role): void
    {
        $rolePermissions = $role->permissions->pluck('name')->all();

        if ($rolePermissions === []) {
            return;
        }

        $missingDependencies = $this->resolveMissingDependencies($rolePermissions);

        if ($missingDependencies === []) {
            return;
        }

        $role->givePermissionTo($missingDependencies);
    }

    private function applyPermissionDependenciesToUser(User $user): void
    {
        $directPermissions = $user->permissions->pluck('name')->all();

        if ($directPermissions === []) {
            return;
        }

        $missingDependencies = $this->resolveMissingDependencies($directPermissions);

        if ($missingDependencies === []) {
            return;
        }

        $user->givePermissionTo($missingDependencies);
    }

    /**
     * @param  array<int, string>  $allPermissions
     */
    private function buildPermissionDependencies(array $allPermissions): void
    {
        $modulePermissions = [];

        foreach ($allPermissions as $permission) {
            if (! str_contains($permission, '.')) {
                continue;
            }

            [$module, $action] = explode('.', $permission, 2);
            $modulePermissions[$module][$action] = $permission;
        }

        foreach ($modulePermissions as $module => $actions) {
            $viewDependencies = array_values(array_filter([
                $actions['view'] ?? null,
                $actions['show'] ?? null,
            ]));

            $createDependency = $actions['create'] ?? null;
            $editDependency = $actions['edit'] ?? null;
            $storeDependency = $actions['store'] ?? null;
            $updateDependency = $actions['update'] ?? null;

            foreach ($actions as $action => $permission) {
                if ($action === 'view' || $action === 'show') {
                    continue;
                }

                $dependencies = $viewDependencies;

                if ($action === 'store' && $createDependency) {
                    $dependencies[] = $createDependency;
                }

                if ($action === 'update' && $editDependency) {
                    $dependencies[] = $editDependency;
                }

                if ($action === 'create' && $storeDependency) {
                    $dependencies[] = $storeDependency;
                }

                if ($action === 'edit' && $updateDependency) {
                    $dependencies[] = $updateDependency;
                }

                if ($dependencies === []) {
                    continue;
                }

                $this->permissionDependencies[$permission] = array_values(array_unique($dependencies));
            }
        }
    }

    /**
     * @param  array<int, string>  $permissionNames
     * @return array<int, string>
     */
    private function resolveMissingDependencies(array $permissionNames): array
    {
        $assigned = array_fill_keys($permissionNames, true);
        $missing = [];

        foreach ($permissionNames as $permission) {
            foreach ($this->permissionDependencies[$permission] ?? [] as $dependency) {
                if (isset($assigned[$dependency])) {
                    continue;
                }

                $assigned[$dependency] = true;
                $missing[$dependency] = $dependency;
            }
        }

        return array_values($missing);
    }
}
