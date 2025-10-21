<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CheckPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ==================== TRUCKS PERMISSIONS ====================
        $truckPermissions = [
            'trucks.view',
            'trucks.show',
            'trucks.create',
            'trucks.store',
            'trucks.edit',
            'trucks.update',
            'trucks.deactivate',
            'trucks.destroy',
            'trucks.export',
            'trucks.free',
        ];

        // ==================== DRIVERS PERMISSIONS ====================
        $driverPermissions = [
            'drivers.view',
            'drivers.show',
            'drivers.create',
            'drivers.store',
            'drivers.edit',
            'drivers.update',
            'drivers.destroy',
            'drivers.export',
        ];

        // ==================== MAINTENANCE PERMISSIONS ====================
        $maintenancePermissions = [
            'maintenance.view',
            'maintenance.show',
            'maintenance.create',
            'maintenance.store',
            'maintenance.edit',
            'maintenance.update',
            'maintenance.destroy',
            'maintenance.export',
        ];

        // ==================== VEHICLE TYPE PERMISSIONS ====================
        $vehicleTypePermissions = [
            'vehicletypes.view',
            'vehicletypes.show',
            'vehicletypes.create',
            'vehicletypes.store',
            'vehicletypes.edit',
            'vehicletypes.update',
            'vehicletypes.destroy',
        ];

        // Combine all permissions
        $allPermissions = array_merge(
            $truckPermissions,
            $driverPermissions,
            $maintenancePermissions,
            $vehicleTypePermissions
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
