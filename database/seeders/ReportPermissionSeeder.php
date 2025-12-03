<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ReportPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $reportActions = [
            'maintenance' => ['view', 'export'],
            'fuel-efficiency' => ['view', 'export'],
            'customer-profitability' => ['view', 'export'],
            'outsource-performance' => ['view', 'export'],
            'operation-profitability' => ['view', 'export'],
            'geography-heatmaps' => ['view', 'export'],
            'truck-grading' => ['view', 'export'],
            'driver-grading' => ['view', 'export'],
            'performance-all' => ['view', 'export'],
            'performance-by-driver' => ['view', 'export'],
            'performance-by-truck' => ['view', 'export'],
            'performance-by-model' => ['view', 'export'],
            'performance-by-status' => ['view', 'export'],
            'attach-detach' => ['view', 'export'],
        ];

        $permissions = [];

        foreach ($reportActions as $report => $actions) {
            foreach ($actions as $action) {
                $permissions[] = "reports.{$report}.{$action}";
            }
        }

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $adminRole = Role::where('name', 'admin')->where('guard_name', 'web')->first();

        if ($adminRole !== null) {
            $adminRole->givePermissionTo($permissions);
        }

        $managerRole = Role::where('name', 'manager')->where('guard_name', 'web')->first();

        if ($managerRole !== null) {
            $managerRole->givePermissionTo($permissions);
        }

        $userRole = Role::where('name', 'user')->where('guard_name', 'web')->first();

        if ($userRole !== null) {
            $userRole->givePermissionTo(
                array_values(
                    array_filter(
                        $permissions,
                        static fn (string $permission): bool => str_ends_with($permission, '.view') ||
                            str_ends_with($permission, '.export')
                    )
                )
            );
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
