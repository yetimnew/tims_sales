<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class CacheInvalidationService
{
    /**
     * Map of model class names to cache keys that should be cleared when the model changes.
     *
     * @var array<string, array<string>>
     */
    private static array $cacheMap = [
        // Trucks
        \App\Models\Truck::class => [
            'trucks.status_options',
            'trucks.vehicle_types',
            'fuel_records.truck_options',
            'maintenance.create_trucks',
            'daily_truck_status.trucks',
            'reports.maintenance.truck_options',
            'reports.fuel_efficiency.truck_options',
            'reports.performance_all.truck_options',
            'reports.performance_by_truck.truck_options',
            'reports.performance_by_truck.statuses',
            'financial.create_trucks',
            'route_plans.create_trucks',
            'driver_performance.create_trucks',
            'truck_grading_settings.statuses',
            'dashboard.total_trucks',
            'dashboard.active_trucks',
        ],

        // Drivers
        \App\Models\Driver::class => [
            'drivers.status_options',
            'drivers.gender_options',
            'fuel_records.driver_options',
            'driver_safety.driver_options',
            'reports.performance_all.driver_options',
            'reports.performance_by_driver.driver_options',
            'activity_logs.filter_options', // Users list in activity logs
            'route_plans.create_drivers',
            'driver_performance.create_drivers',
            'driver_grading_settings.statuses',
            'dashboard.total_drivers',
            'dashboard.active_drivers',
        ],

        // Driver-Truck Assignments
        \App\Models\DriverTruck::class => [
            'driver_trucks.status_options',
            'fuel_records.create_driver_trucks',
        ],

        // Vehicle Types
        \App\Models\VehicleType::class => [
            'trucks.vehicle_types',
            'reports.performance_by_truck.vehicle_types',
            'truck_grading_settings.vehicle_types',
        ],

        // Fuel Records
        \App\Models\FuelRecord::class => [
            'fuel_records.fuel_type_options',
            'fuel_records.truck_options',
            'fuel_records.driver_options',
        ],

        // Driver Safety
        \App\Models\DriverSafetyRecord::class => [
            'driver_safety.incident_type_options',
            'driver_safety.severity_options',
            'driver_safety.driver_options',
        ],

        // Cargo Types
        \App\Models\CargoType::class => [
            'cargo_types.category_options',
        ],

        // Maintenance Records
        \App\Models\VehicleMaintenanceRecord::class => [
            'maintenance.status_options',
            'maintenance.maintenance_type_options',
            'reports.maintenance.status_options',
            'reports.maintenance.service_provider_options',
        ],

        // Maintenance Types
        \App\Models\MaintenanceType::class => [
            'maintenance_types.statistics',
            'maintenance.maintenance_type_options',
            'maintenance.create_maintenance_types',
            'reports.maintenance.maintenance_type_options',
        ],

        // Operations
        \App\Models\Operation::class => [
            'operations.status_options',
            'operations.customer_options',
            'reports.performance_all.operations',
            'reports.outsource_performance.operations',
            'route_plans.create_operations',
            'dashboard.total_operations',
            'dashboard.open_operations',
        ],

        // Performances
        \App\Models\Performance::class => [
            'performances.status_options',
            'performances.load_phase_options',
        ],

        // Customers
        \App\Models\Customer::class => [
            'customers.metrics',
            'operations.customer_options',
            'reports.customer_profitability.customer_options',
        ],

        // Regions
        \App\Models\Region::class => [
            'regions.metrics',
            'zones.create_regions',
        ],

        // Zones
        \App\Models\Zone::class => [
            'zones.metrics',
            'zones.create_regions',
            'woredas.create_zones',
        ],

        // Woredas
        \App\Models\Woreda::class => [
            'woredas.metrics',
            'woredas.create_zones',
            'places.create_woredas',
        ],

        // Places
        \App\Models\Place::class => [
            'places.metrics',
            'distances.create_places',
            'outsource_performances.create_places',
            'reports.performance_all.destinations',
            'reports.outsource_performance.destinations',
            'route_plans.create_places',
        ],

        // Distances
        \App\Models\Distance::class => [
            'distances.metrics',
            'distances.create_places',
        ],

        // Status Types
        \App\Models\StatusType::class => [
            'daily_truck_status.operational_status_type',
            'daily_truck_status.statuses',
        ],

        // Daily Truck Statuses
        \App\Models\DailyTruckStatus::class => [
            'daily_truck_status.trucks',
            'daily_truck_status.operational_status_type',
            'daily_truck_status.statuses',
        ],

        // Statuses
        \App\Models\Status::class => [
            'daily_truck_status.statuses',
        ],

        // Outsources
        \App\Models\Outsource::class => [
            'outsources.status_options',
            'outsources.service_type_options',
            'outsource_performances.outsource_options',
            'outsource_performances.create_outsources',
            'reports.outsource_performance.vendor_options',
        ],

        // Outsource Performances
        \App\Models\OutsourcePerformance::class => [
            'outsource_performances.status_options',
            'reports.outsource_performance.status_options',
        ],

        // Users
        \App\Models\User::class => [
            'users.role_options',
            'users.create_roles',
            'users.create_notification_types',
            'activity_logs.filter_options', // Users list in activity logs
        ],

        // Roles (Spatie Permission)
        \Spatie\Permission\Models\Role::class => [
            'roles.permission_group_options',
            'users.role_options',
            'users.create_roles',
        ],

        // Permissions (Spatie Permission)
        \Spatie\Permission\Models\Permission::class => [
            'roles.permission_group_options',
            'roles.create_permissions',
            'permissions.module_options',
        ],

        // Notification Types
        \App\Models\NotificationType::class => [
            'users.create_notification_types',
            'notification_preferences.notification_types',
        ],

        // Route Plans
        \App\Models\RoutePlan::class => [
            'route_plans.statistics',
            'route_plans.create_operations',
            'route_plans.create_trucks',
            'route_plans.create_drivers',
            'route_plans.create_places',
        ],

        // Driver Performance Records
        \App\Models\DriverPerformanceRecord::class => [
            'driver_performance.statistics',
            'driver_performance.create_drivers',
            'driver_performance.create_trucks',
        ],

        // Truck Financial Records
        \App\Models\TruckFinancialRecord::class => [
            'financial.statistics',
            'financial.create_trucks',
        ],

        // Fuel Records (for statistics and options)
        \App\Models\FuelRecord::class => [
            'fuel_records.fuel_type_options',
            'fuel_records.truck_options',
            'fuel_records.driver_options',
            'fuel_records.statistics',
            'fuel_records.create_driver_trucks',
        ],
    ];

    /**
     * Clear all caches associated with a model.
     */
    public static function clearModelCaches(Model $model): void
    {
        $modelClass = get_class($model);
        $cacheKeys = self::$cacheMap[$modelClass] ?? [];

        foreach ($cacheKeys as $cacheKey) {
            Cache::forget($cacheKey);
        }

        // Also clear metrics cache for activity logs when any model changes
        Cache::forget('activity_logs.metrics');
    }

    /**
     * Clear specific cache keys.
     *
     * @param  array<string>  $cacheKeys
     */
    public static function clearCaches(array $cacheKeys): void
    {
        foreach ($cacheKeys as $cacheKey) {
            Cache::forget($cacheKey);
        }
    }

    /**
     * Register cache keys for a model.
     *
     * @param  string  $modelClass
     * @param  array<string>  $cacheKeys
     */
    public static function registerModelCaches(string $modelClass, array $cacheKeys): void
    {
        if (! isset(self::$cacheMap[$modelClass])) {
            self::$cacheMap[$modelClass] = [];
        }

        self::$cacheMap[$modelClass] = array_unique(
            array_merge(self::$cacheMap[$modelClass], $cacheKeys)
        );
    }

    /**
     * Get all cache keys for a model.
     *
     * @param  string  $modelClass
     * @return array<string>
     */
    public static function getModelCacheKeys(string $modelClass): array
    {
        return self::$cacheMap[$modelClass] ?? [];
    }
}

