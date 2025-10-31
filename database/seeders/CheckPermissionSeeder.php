<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CheckPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ==================== TRUCKS PERMISSIONS ====================
        $truckPermissions = [
            'trucks.view', 'trucks.show', 'trucks.create', 'trucks.store', 'trucks.edit',
            'trucks.update', 'trucks.deactivate', 'trucks.destroy', 'trucks.export', 'trucks.free',
        ];

        // ==================== DRIVERS PERMISSIONS ====================
        $driverPermissions = [
            'drivers.view', 'drivers.show', 'drivers.create', 'drivers.store', 'drivers.edit',
            'drivers.update', 'drivers.destroy', 'drivers.export', 'drivers.deactivate',
        ];

        // ==================== MAINTENANCE PERMISSIONS ====================
        $maintenancePermissions = [
            'maintenance.view', 'maintenance.show', 'maintenance.create', 'maintenance.store', 'maintenance.edit',
            'maintenance.update', 'maintenance.destroy', 'maintenance.export', 'maintenance.complete',
        ];

        // ==================== VEHICLE TYPE PERMISSIONS ====================
        $vehicleTypePermissions = [
            'vehicletypes.view', 'vehicletypes.show', 'vehicletypes.create', 'vehicletypes.store',
            'vehicletypes.edit', 'vehicletypes.update', 'vehicletypes.destroy', 'vehicletypes.export',
        ];

        // ==================== FUEL PERMISSIONS ====================
        $fuelPermissions = [
            'fuel.view', 'fuel.show', 'fuel.create', 'fuel.store', 'fuel.edit',
            'fuel.update', 'fuel.destroy', 'fuel.export', 'fuel.analysis',
        ];

        // ==================== FINANCIAL PERMISSIONS ====================
        $financialPermissions = [
            'financial.view', 'financial.show', 'financial.create', 'financial.store', 'financial.edit',
            'financial.update', 'financial.destroy', 'financial.export', 'financial.analytics',
        ];

        // ==================== CARGO TYPE PERMISSIONS ====================
        $cargoTypePermissions = [
            'cargotypes.view', 'cargotypes.show', 'cargotypes.create', 'cargotypes.store',
            'cargotypes.edit', 'cargotypes.update', 'cargotypes.destroy', 'cargotypes.export',
        ];

        // ==================== REGION PERMISSIONS ====================
        $regionPermissions = [
            'regions.view', 'regions.show', 'regions.create', 'regions.store',
            'regions.edit', 'regions.update', 'regions.destroy', 'regions.export',
        ];

        // ==================== ZONE PERMISSIONS ====================
        $zonePermissions = [
            'zones.view', 'zones.show', 'zones.create', 'zones.store',
            'zones.edit', 'zones.update', 'zones.destroy', 'zones.export',
        ];

        // ==================== WOREDA PERMISSIONS ====================
        $woredaPermissions = [
            'woredas.view', 'woredas.show', 'woredas.create', 'woredas.store',
            'woredas.edit', 'woredas.update', 'woredas.destroy', 'woredas.export',
        ];

        // ==================== PLACE PERMISSIONS ====================
        $placePermissions = [
            'places.view', 'places.show', 'places.create', 'places.store',
            'places.edit', 'places.update', 'places.destroy', 'places.export',
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
            'operations.edit', 'operations.update', 'operations.destroy', 'operations.export',
            'operations.deactivate', 'operations.available',
        ];

        // ==================== CUSTOMER PERMISSIONS ====================
        $customerPermissions = [
            'customers.view', 'customers.show', 'customers.create', 'customers.store',
            'customers.edit', 'customers.update', 'customers.destroy', 'customers.export',
            'customers.deactivate', 'customers.active',
        ];

        // ==================== REGION PERMISSIONS ====================
        $regionPermissions = [
            'regions.view', 'regions.show', 'regions.create', 'regions.store',
            'regions.edit', 'regions.update', 'regions.destroy', 'regions.export',
            'regions.deactivate', 'regions.active',
        ];

        // ==================== ZONE PERMISSIONS ====================
        $zonePermissions = [
            'zones.view', 'zones.show', 'zones.create', 'zones.store',
            'zones.edit', 'zones.update', 'zones.destroy', 'zones.export',
            'zones.deactivate', 'zones.active',
        ];

        // ==================== WOREDA PERMISSIONS ====================
        $woredaPermissions = [
            'woredas.view', 'woredas.show', 'woredas.create', 'woredas.store',
            'woredas.edit', 'woredas.update', 'woredas.destroy', 'woredas.export',
            'woredas.deactivate', 'woredas.active',
        ];

        // ==================== PLACE PERMISSIONS ====================
        $placePermissions = [
            'places.view', 'places.show', 'places.create', 'places.store',
            'places.edit', 'places.update', 'places.destroy', 'places.export',
            'places.deactivate', 'places.active',
        ];

        // ==================== DISTANCE PERMISSIONS ====================
        $distancePermissions = [
            'distances.view', 'distances.show', 'distances.create', 'distances.store',
            'distances.edit', 'distances.update', 'distances.destroy', 'distances.export',
            'distances.deactivate', 'distances.active',
        ];

        // ==================== PERFORMANCE PERMISSIONS ====================
        $performancePermissions = [
            'performances.view', 'performances.show', 'performances.create', 'performances.store',
            'performances.edit', 'performances.update', 'performances.destroy', 'performances.export',
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

        // ==================== TELESCOPE PERMISSIONS ====================
        $telescopePermissions = [
            'view telescope',
        ];

        // ==================== COMBINE ALL PERMISSIONS ====================
        $allPermissions = array_merge(
            $truckPermissions,
            $driverPermissions,
            $maintenancePermissions,
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
            $userPermissions,
            $rolePermissions,
            $permissionPermissions,
            $telescopePermissions
        );

        // Create all permissions
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // ==================== ROLES CONFIGURATION ====================

        // ADMIN: All permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions($allPermissions);

        // MANAGER: All except destroy
        $managerPermissions = array_filter(
            $allPermissions,
            fn($permission) => !str_contains($permission, '.destroy')
        );
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $managerRole->syncPermissions($managerPermissions);

        // USER: Only view, show, export
        $userPermissions = array_filter(
            $allPermissions,
            fn($permission) => str_contains($permission, '.view') ||
                               str_contains($permission, '.show') ||
                               str_contains($permission, '.export')
        );
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $userRole->syncPermissions($userPermissions);
    }
}
