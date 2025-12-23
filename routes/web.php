<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\FleetAnalyticsController;
use App\Http\Controllers\NotificationPreferenceAdminController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\TruckController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => false, // Registration disabled - only admin can create users
    ]);
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Fleet analytics cockpit
    Route::get('analytics/cockpit', [FleetAnalyticsController::class, 'index'])
        ->name('analytics.cockpit');

    // Trucks with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // All other truck routes with individual permission checks
        Route::get('trucks', [TruckController::class, 'index'])
            ->middleware('can:trucks.view')
            ->name('trucks.index');

        Route::get('trucks/create', [TruckController::class, 'create'])
            ->middleware('can:trucks.create')
            ->name('trucks.create');

        Route::post('trucks', [TruckController::class, 'store'])
            ->middleware(['can:trucks.store', 'throttle:10,1'])
            ->name('trucks.store');

        Route::get('trucks/{truck}', [TruckController::class, 'show'])
            ->middleware('can:trucks.show')
            ->name('trucks.show');

        Route::get('trucks/{truck}/assignments/{driverTruck}/performances', [TruckController::class, 'assignmentPerformances'])
            ->middleware('can:trucks.show')
            ->whereNumber('driverTruck')
            ->name('trucks.assignments.performances');

        Route::get('trucks/{truck}/edit', [TruckController::class, 'edit'])
            ->middleware('can:trucks.edit')
            ->name('trucks.edit');

        Route::put('trucks/{truck}', [TruckController::class, 'update'])
            ->middleware('can:trucks.update')
            ->name('trucks.update');

        Route::delete('trucks/{truck}', [TruckController::class, 'destroy'])
            ->middleware('can:trucks.destroy')
            ->name('trucks.destroy');

        Route::post('trucks/{truck}/deactivate', [TruckController::class, 'deactivate'])
            ->middleware('can:trucks.deactivate')
            ->name('trucks.deactivate');

        Route::post('trucks/{truck}/activate', [TruckController::class, 'activate'])
            ->middleware('can:trucks.activate')
            ->name('trucks.activate');

    });

    // Truck Status History (per-truck timeline)
    Route::get('trucks/{truck}/status-history', [\App\Http\Controllers\TruckController::class, 'statusHistory'])
        ->name('trucks.status-history');

    // Driver Truck Assignments with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('driver-trucks', [\App\Http\Controllers\DriverTruckController::class, 'index'])
            ->middleware('can:driver-trucks.view')
            ->name('driver-trucks.index');

        Route::get('driver-trucks/create', [\App\Http\Controllers\DriverTruckController::class, 'create'])
            ->middleware('can:driver-trucks.create')
            ->name('driver-trucks.create');

        Route::post('driver-trucks', [\App\Http\Controllers\DriverTruckController::class, 'store'])
            ->middleware(['can:driver-trucks.create', 'throttle:5,1'])
            ->name('driver-trucks.store');

        Route::get('driver-trucks/{driverTruck}', [\App\Http\Controllers\DriverTruckController::class, 'show'])
            ->middleware('can:driver-trucks.view')
            ->name('driver-trucks.show');

        Route::get('driver-trucks/{driverTruck}/edit', [\App\Http\Controllers\DriverTruckController::class, 'edit'])
            ->middleware('can:driver-trucks.edit')
            ->name('driver-trucks.edit');

        Route::put('driver-trucks/{driverTruck}', [\App\Http\Controllers\DriverTruckController::class, 'update'])
            ->middleware('can:driver-trucks.edit')
            ->name('driver-trucks.update');

        Route::delete('driver-trucks/{driverTruck}', [\App\Http\Controllers\DriverTruckController::class, 'destroy'])
            ->middleware('can:driver-trucks.destroy')
            ->name('driver-trucks.destroy');

        Route::get('driver-trucks/{driverTruck}/detach', [\App\Http\Controllers\DriverTruckController::class, 'detach'])
            ->middleware('can:driver-trucks.detach')
            ->name('driver-trucks.detach');

        Route::post('driver-trucks/{driverTruck}/detach', [\App\Http\Controllers\DriverTruckController::class, 'updateDetach'])
            ->middleware('can:driver-trucks.detach')
            ->name('driver-trucks.update-detach');
    });

    // Status per-day view
    Route::get('statuses/{status}/daily', [\App\Http\Controllers\StatusController::class, 'daily'])
        ->name('statuses.daily');

    // Drivers with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {

        // All other driver routes with individual permission checks
        Route::get('drivers', [DriverController::class, 'index'])
            ->middleware('can:drivers.view')
            ->name('drivers.index');

        Route::get('drivers/create', [DriverController::class, 'create'])
            ->middleware('can:drivers.create')
            ->name('drivers.create');

        Route::post('drivers', [DriverController::class, 'store'])
            ->middleware(['can:drivers.store', 'throttle:10,1'])
            ->name('drivers.store');

        Route::get('drivers/export', [DriverController::class, 'export'])
            ->middleware('can:drivers.export')
            ->name('drivers.export');

        Route::get('drivers/{driver}', [DriverController::class, 'show'])
            ->middleware('can:drivers.show')
            ->name('drivers.show');

        Route::get('drivers/{driver}/assignments/{driverTruck}/performances', [DriverController::class, 'assignmentPerformances'])
            ->middleware('can:drivers.show')
            ->whereNumber('driverTruck')
            ->name('drivers.assignments.performances');

        Route::get('drivers/{driver}/edit', [DriverController::class, 'edit'])
            ->middleware('can:drivers.edit')
            ->name('drivers.edit');

        Route::put('drivers/{driver}', [DriverController::class, 'update'])
            ->middleware('can:drivers.update')
            ->name('drivers.update');

        Route::delete('drivers/{driver}', [DriverController::class, 'destroy'])
            ->middleware('can:drivers.destroy')
            ->name('drivers.destroy');

        Route::post('drivers/{driver}/deactivate', [DriverController::class, 'deactivate'])
            ->middleware('can:drivers.deactivate')
            ->name('drivers.deactivate');

        Route::post('drivers/{driver}/activate', [DriverController::class, 'activate'])
            ->middleware('can:drivers.activate')
            ->name('drivers.activate');
    });

    // Performances with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // All other performance routes with individual permission checks
        Route::get('performances', [PerformanceController::class, 'index'])
            ->middleware('can:performances.view')
            ->name('performances.index');

        Route::get('performances/create', [PerformanceController::class, 'create'])
            ->middleware('can:performances.create')
            ->name('performances.create');

        Route::post('performances', [PerformanceController::class, 'store'])
            ->middleware(['can:performances.store', 'throttle:15,1'])
            ->name('performances.store');

        Route::get('performances/{performance}', [PerformanceController::class, 'show'])
            ->whereNumber('performance')
            ->middleware('can:performances.show')
            ->name('performances.show');

        Route::get('performances/{performance}/edit', [PerformanceController::class, 'edit'])
            ->whereNumber('performance')
            ->middleware('can:performances.edit')
            ->name('performances.edit');

        Route::put('performances/{performance}', [PerformanceController::class, 'update'])
            ->whereNumber('performance')
            ->middleware('can:performances.update')
            ->name('performances.update');

        Route::delete('performances/{performance}', [PerformanceController::class, 'destroy'])
            ->whereNumber('performance')
            ->middleware('can:performances.destroy')
            ->name('performances.destroy');

        Route::post('performances/{performance}/deactivate', [PerformanceController::class, 'deactivate'])
            ->whereNumber('performance')
            ->middleware('can:performances.deactivate')
            ->name('performances.deactivate');

        Route::get('performances/active/list', [PerformanceController::class, 'activePerformances'])
            ->middleware('can:performances.active')
            ->name('performances.active');

        // Additional performance routes
        Route::get('performances/status/list', [PerformanceController::class, 'statusList'])
            ->name('performances.status.list');
        Route::get('performances/calculate-distance', [PerformanceController::class, 'calculateDistance'])
            ->name('performances.calculate-distance');
    });

    // Maintenance Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('maintenance-overview', [\App\Http\Controllers\MaintenanceController::class, 'overview'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.overview');

        Route::get('maintenance/alerts', [\App\Http\Controllers\MaintenanceController::class, 'alerts'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.alerts');

        Route::get('maintenance', [\App\Http\Controllers\MaintenanceController::class, 'index'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.index');

        Route::get('maintenance/create', [\App\Http\Controllers\MaintenanceController::class, 'create'])
            ->middleware('can:maintenance.create')
            ->name('maintenance.create');

        Route::post('maintenance', [\App\Http\Controllers\MaintenanceController::class, 'store'])
            ->middleware('can:maintenance.store')
            ->name('maintenance.store');

        Route::get('maintenance/{maintenance}', [\App\Http\Controllers\MaintenanceController::class, 'show'])
            ->middleware('can:maintenance.show')
            ->name('maintenance.show');

        Route::get('maintenance/{maintenance}/edit', [\App\Http\Controllers\MaintenanceController::class, 'edit'])
            ->middleware('can:maintenance.edit')
            ->name('maintenance.edit');

        Route::put('maintenance/{maintenance}', [\App\Http\Controllers\MaintenanceController::class, 'update'])
            ->middleware('can:maintenance.update')
            ->name('maintenance.update');

        Route::delete('maintenance/{maintenance}', [\App\Http\Controllers\MaintenanceController::class, 'destroy'])
            ->middleware('can:maintenance.destroy')
            ->name('maintenance.destroy');

        Route::get('maintenance/overdue/list', [\App\Http\Controllers\MaintenanceController::class, 'overdue'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.overdue');

        Route::get('maintenance/upcoming/list', [\App\Http\Controllers\MaintenanceController::class, 'upcoming'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.upcoming');

        Route::post('maintenance/{maintenance}/complete', [\App\Http\Controllers\MaintenanceController::class, 'complete'])
            ->middleware('can:maintenance.update')
            ->name('maintenance.complete');
    });

    // Maintenance Type Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::delete('maintenance-types/bulk-delete', [\App\Http\Controllers\MaintenanceTypeController::class, 'bulkDelete'])
            ->middleware('can:maintenance-types.destroy')
            ->name('maintenance-types.bulk-delete');

        Route::patch('maintenance-types/bulk-activate', [\App\Http\Controllers\MaintenanceTypeController::class, 'bulkActivate'])
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.bulk-activate');

        Route::patch('maintenance-types/bulk-deactivate', [\App\Http\Controllers\MaintenanceTypeController::class, 'bulkDeactivate'])
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.bulk-deactivate');

        Route::get('maintenance-types', [\App\Http\Controllers\MaintenanceTypeController::class, 'index'])
            ->middleware('can:maintenance-types.view')
            ->name('maintenance-types.index');

        Route::get('maintenance-types/create', [\App\Http\Controllers\MaintenanceTypeController::class, 'create'])
            ->middleware('can:maintenance-types.create')
            ->name('maintenance-types.create');

        Route::post('maintenance-types', [\App\Http\Controllers\MaintenanceTypeController::class, 'store'])
            ->middleware('can:maintenance-types.store')
            ->name('maintenance-types.store');

        Route::get('maintenance-types/{maintenanceType}', [\App\Http\Controllers\MaintenanceTypeController::class, 'show'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.show')
            ->name('maintenance-types.show');

        Route::get('maintenance-types/{maintenanceType}/edit', [\App\Http\Controllers\MaintenanceTypeController::class, 'edit'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.edit')
            ->name('maintenance-types.edit');

        Route::put('maintenance-types/{maintenanceType}', [\App\Http\Controllers\MaintenanceTypeController::class, 'update'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.update');

        Route::delete('maintenance-types/{maintenanceType}', [\App\Http\Controllers\MaintenanceTypeController::class, 'destroy'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.destroy')
            ->name('maintenance-types.destroy');
    });

    // Fuel Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('fuel', [\App\Http\Controllers\FuelController::class, 'index'])
            ->middleware('can:fuel.view')
            ->name('fuel.index');

        Route::get('fuel/create', [\App\Http\Controllers\FuelController::class, 'create'])
            ->middleware('can:fuel.create')
            ->name('fuel.create');

        Route::post('fuel', [\App\Http\Controllers\FuelController::class, 'store'])
            ->middleware('can:fuel.store')
            ->name('fuel.store');

        Route::get('fuel/{fuel}', [\App\Http\Controllers\FuelController::class, 'show'])
            ->middleware('can:fuel.show')
            ->name('fuel.show');

        Route::get('fuel/{fuel}/edit', [\App\Http\Controllers\FuelController::class, 'edit'])
            ->middleware('can:fuel.edit')
            ->name('fuel.edit');

        Route::put('fuel/{fuel}', [\App\Http\Controllers\FuelController::class, 'update'])
            ->middleware('can:fuel.update')
            ->name('fuel.update');

        Route::delete('fuel/{fuel}', [\App\Http\Controllers\FuelController::class, 'destroy'])
            ->middleware('can:fuel.destroy')
            ->name('fuel.destroy');

        Route::get('fuel/analysis', [\App\Http\Controllers\FuelController::class, 'analysis'])
            ->middleware('can:fuel.view')
            ->name('fuel.analysis');

        Route::post('fuel/generate-analysis', [\App\Http\Controllers\FuelController::class, 'generateAnalysis'])
            ->middleware('can:fuel.view')
            ->name('fuel.generate.analysis');
    });

    // Driver Performance Management
    Route::resource('driver-performance', \App\Http\Controllers\DriverPerformanceController::class);
    Route::get('driver-performance/analytics', [\App\Http\Controllers\DriverPerformanceController::class, 'analytics'])->name('driver-performance.analytics');
    Route::get('driver-performance/top-performers', [\App\Http\Controllers\DriverPerformanceController::class, 'topPerformers'])->name('driver-performance.top-performers');

    // Driver Safety Management
    Route::resource('driver-safety', \App\Http\Controllers\DriverSafetyController::class);
    Route::get('driver-safety/analytics', [\App\Http\Controllers\DriverSafetyController::class, 'analytics'])->name('driver-safety.analytics');
    Route::get('driver-safety/drivers-with-issues', [\App\Http\Controllers\DriverSafetyController::class, 'driversWithIssues'])->name('driver-safety.drivers-with-issues');

    // Cargo Management
    Route::resource('cargo-types', \App\Http\Controllers\CargoTypeController::class);
    Route::get('cargo-types/statistics', [\App\Http\Controllers\CargoTypeController::class, 'statistics'])->name('cargo-types.statistics');
    Route::get('cargo-types/by-category', [\App\Http\Controllers\CargoTypeController::class, 'byCategory'])->name('cargo-types.by-category');

    // Operations with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // All operation routes with individual permission checks
        Route::get('operations', [\App\Http\Controllers\OperationController::class, 'index'])
            ->middleware('can:operations.view')
            ->name('operations.index');

        Route::get('operations/search', [\App\Http\Controllers\OperationController::class, 'search'])
            ->name('operations.search');

        Route::get('operations/create', [\App\Http\Controllers\OperationController::class, 'create'])
            ->middleware('can:operations.create')
            ->name('operations.create');

        Route::post('operations', [\App\Http\Controllers\OperationController::class, 'store'])
            ->middleware('can:operations.store')
            ->name('operations.store');

        Route::get('operations/{operation}', [\App\Http\Controllers\OperationController::class, 'show'])
            ->middleware('can:operations.show')
            ->name('operations.show');

        Route::get('operations/{operation}/edit', [\App\Http\Controllers\OperationController::class, 'edit'])
            ->middleware('can:operations.edit')
            ->name('operations.edit');

        Route::put('operations/{operation}', [\App\Http\Controllers\OperationController::class, 'update'])
            ->middleware('can:operations.update')
            ->name('operations.update');

        Route::delete('operations/{operation}', [\App\Http\Controllers\OperationController::class, 'destroy'])
            ->middleware('can:operations.destroy')
            ->name('operations.destroy');

        Route::post('operations/{operation}/deactivate', [\App\Http\Controllers\OperationController::class, 'deactivate'])
            ->middleware('can:operations.deactivate')
            ->name('operations.deactivate');

        Route::get('operations/available/list', [\App\Http\Controllers\OperationController::class, 'availableOperations'])
            ->middleware('can:operations.available')
            ->name('operations.available');
    });

    // Customers
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('customers', [\App\Http\Controllers\CustomerController::class, 'index'])
            ->middleware('can:customers.view')
            ->name('customers.index');

        Route::get('customers/create', [\App\Http\Controllers\CustomerController::class, 'create'])
            ->middleware('can:customers.create')
            ->name('customers.create');

        Route::post('customers', [\App\Http\Controllers\CustomerController::class, 'store'])
            ->middleware('can:customers.store')
            ->name('customers.store');

        Route::get('customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'show'])
            ->middleware('can:customers.show')
            ->name('customers.show');

        Route::get('customers/{customer}/edit', [\App\Http\Controllers\CustomerController::class, 'edit'])
            ->middleware('can:customers.edit')
            ->name('customers.edit');

        Route::put('customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'update'])
            ->middleware('can:customers.update')
            ->name('customers.update');

        Route::delete('customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'destroy'])
            ->middleware('can:customers.destroy')
            ->name('customers.destroy');

        Route::post('customers/{customer}/deactivate', [\App\Http\Controllers\CustomerController::class, 'deactivate'])
            ->middleware('can:customers.deactivate')
            ->name('customers.deactivate');

        Route::get('customers/active/list', [\App\Http\Controllers\CustomerController::class, 'activeCustomers'])
            ->middleware('can:customers.active')
            ->name('customers.active');
    });

    // Geographic Management
    Route::resource('regions', \App\Http\Controllers\RegionController::class);
    Route::post('regions/{region}/deactivate', [\App\Http\Controllers\RegionController::class, 'deactivate'])
        ->middleware('can:regions.deactivate')
        ->name('regions.deactivate');
    Route::get('regions/active/list', [\App\Http\Controllers\RegionController::class, 'activeRegions'])
        ->middleware('can:regions.active')
        ->name('regions.active');

    Route::resource('zones', \App\Http\Controllers\ZoneController::class);
    Route::post('zones/{zone}/deactivate', [\App\Http\Controllers\ZoneController::class, 'deactivate'])
        ->middleware('can:zones.deactivate')
        ->name('zones.deactivate');
    Route::get('zones/active/list', [\App\Http\Controllers\ZoneController::class, 'activeZones'])
        ->middleware('can:zones.active')
        ->name('zones.active');

    Route::resource('woredas', \App\Http\Controllers\WoredaController::class);
    Route::post('woredas/{woreda}/deactivate', [\App\Http\Controllers\WoredaController::class, 'deactivate'])
        ->middleware('can:woredas.deactivate')
        ->name('woredas.deactivate');
    Route::get('woredas/active/list', [\App\Http\Controllers\WoredaController::class, 'activeWoredas'])
        ->middleware('can:woredas.active')
        ->name('woredas.active');

    Route::get('places/search', [\App\Http\Controllers\PlaceController::class, 'search'])
        ->middleware('can:places.search')
        ->name('places.search');

    Route::resource('places', \App\Http\Controllers\PlaceController::class);
    Route::post('places/{place}/deactivate', [\App\Http\Controllers\PlaceController::class, 'deactivate'])
        ->middleware('can:places.deactivate')
        ->name('places.deactivate');
    Route::get('places/active/list', [\App\Http\Controllers\PlaceController::class, 'activePlaces'])
        ->middleware('can:places.active')
        ->name('places.active');

    Route::resource('distances', \App\Http\Controllers\DistanceController::class);
    Route::post('distances/{distance}/deactivate', [\App\Http\Controllers\DistanceController::class, 'deactivate'])
        ->middleware('can:distances.deactivate')
        ->name('distances.deactivate');
    Route::get('distances/active/list', [\App\Http\Controllers\DistanceController::class, 'activeDistances'])
        ->middleware('can:distances.active')
        ->name('distances.active');

    // Vehicle Types
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('vehicletypes', [\App\Http\Controllers\VehicleTypeController::class, 'index'])
            ->middleware('can:vehicletypes.view')
            ->name('vehicletypes.index');

        Route::get('vehicletypes/create', [\App\Http\Controllers\VehicleTypeController::class, 'create'])
            ->middleware('can:vehicletypes.create')
            ->name('vehicletypes.create');

        Route::post('vehicletypes', [\App\Http\Controllers\VehicleTypeController::class, 'store'])
            ->middleware('can:vehicletypes.store')
            ->name('vehicletypes.store');

        Route::get('vehicletypes/{vehicletype}', [\App\Http\Controllers\VehicleTypeController::class, 'show'])
            ->middleware('can:vehicletypes.show')
            ->name('vehicletypes.show');

        Route::get('vehicletypes/{vehicletype}/edit', [\App\Http\Controllers\VehicleTypeController::class, 'edit'])
            ->middleware('can:vehicletypes.edit')
            ->name('vehicletypes.edit');

        Route::put('vehicletypes/{vehicletype}', [\App\Http\Controllers\VehicleTypeController::class, 'update'])
            ->middleware('can:vehicletypes.update')
            ->name('vehicletypes.update');

        Route::delete('vehicletypes/{vehicletype}', [\App\Http\Controllers\VehicleTypeController::class, 'destroy'])
            ->middleware('can:vehicletypes.destroy')
            ->name('vehicletypes.destroy');
    });

    // Status Management
    Route::resource('statustypes', \App\Http\Controllers\StatusTypeController::class);
    Route::resource('statuses', \App\Http\Controllers\StatusController::class);

    // Truck Status Board
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('truck-status-board', [\App\Http\Controllers\DailyTruckStatusController::class, 'index'])
            ->middleware('can:truck-status-board.view')
            ->name('truck-status-board.index');

        Route::get('truck-status-board/trucks/{truck}', [\App\Http\Controllers\DailyTruckStatusController::class, 'show'])
            ->middleware('can:truck-status-board.view')
            ->name('truck-status-board.trucks.show');

        Route::post('truck-status-board', [\App\Http\Controllers\DailyTruckStatusController::class, 'store'])
            ->middleware('can:truck-status-board.update')
            ->name('truck-status-board.store');
    });

    // Outsourcing
    Route::resource('outsources', \App\Http\Controllers\OutsourceController::class);
    Route::resource('outsource-performances', \App\Http\Controllers\OutsourcePerformanceController::class);

    // Reports
    Route::get('reports/maintenance', [\App\Http\Controllers\ReportController::class, 'maintenance'])
        ->middleware('can:reports.maintenance.view')
        ->name('reports.maintenance');
    Route::get('reports/fuel-efficiency', [\App\Http\Controllers\ReportController::class, 'fuelEfficiency'])
        ->middleware('can:reports.fuel-efficiency.view')
        ->name('reports.fuel-efficiency');
    Route::get('reports/customer-profitability', [\App\Http\Controllers\ReportController::class, 'customerProfitability'])
        ->middleware('can:reports.customer-profitability.view')
        ->name('reports.customer-profitability');
    Route::get('reports/outsource-performance', [\App\Http\Controllers\ReportController::class, 'outsourcePerformanceReport'])
        ->middleware('can:reports.outsource-performance.view')
        ->name('reports.outsource-performance');
    Route::get('reports/outsource-performance/export/{format}', [\App\Http\Controllers\ReportController::class, 'outsourcePerformanceExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.outsource-performance.export')
        ->name('reports.outsource-performance.export');
    Route::get('reports/operation-profitability', [\App\Http\Controllers\ReportController::class, 'operationProfitability'])
        ->middleware('can:reports.operation-profitability.view')
        ->name('reports.operation-profitability');
    Route::get('reports/geography-heatmaps', [\App\Http\Controllers\ReportController::class, 'geographyHeatmaps'])
        ->middleware('can:reports.geography-heatmaps.view')
        ->name('reports.geography-heatmaps');
    Route::get('reports/truck-grading', [\App\Http\Controllers\ReportController::class, 'truckGrading'])
        ->middleware('can:reports.truck-grading.view')
        ->name('reports.truck-grading');
    Route::get('reports/driver-grading', [\App\Http\Controllers\ReportController::class, 'driverGrading'])
        ->middleware('can:reports.driver-grading.view')
        ->name('reports.driver-grading');
    Route::get('reports/driver-truck-grading', [\App\Http\Controllers\ReportController::class, 'driverTruckGrading'])
        ->middleware('can:reports.driver-truck-grading.view')
        ->name('reports.driver-truck-grading');
    Route::get('reports/driver-safety', [\App\Http\Controllers\ReportController::class, 'driverSafety'])
        ->middleware('can:reports.driver-safety.view')
        ->name('reports.driver-safety');
    Route::get('reports/performance-all', [\App\Http\Controllers\ReportController::class, 'performanceAll'])
        ->middleware('can:reports.performance-all.view')
        ->name('reports.performance-all');
    Route::get('reports/performance-all/export/{format}', [\App\Http\Controllers\ReportController::class, 'performanceAllExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.performance-all.export')
        ->name('reports.performance-all.export');
    Route::get('reports/performance-by-driver', [\App\Http\Controllers\ReportController::class, 'performanceByDriver'])
        ->middleware('can:reports.performance-by-driver.view')
        ->name('reports.performance-by-driver');
    Route::get('reports/performance-by-driver/export/{format}', [\App\Http\Controllers\ReportController::class, 'performanceByDriverExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.performance-by-driver.export')
        ->name('reports.performance-by-driver.export');
    Route::get('reports/performance-by-truck', [\App\Http\Controllers\ReportController::class, 'performanceByTruck'])
        ->middleware('can:reports.performance-by-truck.view')
        ->name('reports.performance-by-truck');
    Route::get('reports/performance-by-truck/export/{format}', [\App\Http\Controllers\ReportController::class, 'performanceByTruckExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.performance-by-truck.export')
        ->name('reports.performance-by-truck.export');
    Route::get('reports/performance-by-status', [\App\Http\Controllers\ReportController::class, 'performanceByStatus'])
        ->middleware('can:reports.performance-by-status.view')
        ->name('reports.performance-by-status');
    Route::get('reports/daily-status', [\App\Http\Controllers\ReportController::class, 'dailyStatus'])
        ->middleware('can:reports.daily-status.view')
        ->name('reports.daily-status');
    Route::get('reports/daily-status/export/{format}', [\App\Http\Controllers\ReportController::class, 'dailyStatusExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.daily-status.export')
        ->name('reports.daily-status.export');
    Route::get('reports/driver-truck-attach-detach', [\App\Http\Controllers\ReportController::class, 'driverTruckAttachDetach'])
        ->middleware('can:reports.attach-detach.view')
        ->name('reports.attach-detach');
    Route::get('reports/route-profitability', [\App\Http\Controllers\ReportController::class, 'routeProfitability'])
        ->middleware('can:reports.route-profitability.view')
        ->name('reports.route-profitability');
    Route::get('reports/load-factor-utilization', [\App\Http\Controllers\ReportController::class, 'loadFactorUtilization'])
        ->middleware('can:reports.load-factor-utilization.view')
        ->name('reports.load-factor-utilization');
    Route::get('reports/load-factor-utilization/export/{format}', [\App\Http\Controllers\ReportController::class, 'loadFactorUtilizationExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.load-factor-utilization.export')
        ->name('reports.load-factor-utilization.export');
    Route::get('reports/cost-per-kilometer', [\App\Http\Controllers\ReportController::class, 'costPerKilometer'])
        ->middleware('can:reports.cost-per-kilometer.view')
        ->name('reports.cost-per-kilometer');
    Route::get('reports/cost-per-kilometer/export/{format}', [\App\Http\Controllers\ReportController::class, 'costPerKilometerExport'])
        ->whereIn('format', ['csv', 'xlsx', 'pdf'])
        ->middleware('can:reports.cost-per-kilometer.export')
        ->name('reports.cost-per-kilometer.export');

    // Activity Logs
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('activity-logs', [ActivityLogController::class, 'index'])
            ->middleware('can:activity-logs.view')
            ->name('activity-logs.index');

        Route::get('activity-logs/export/excel', [ActivityLogController::class, 'exportExcel'])
            ->middleware('can:activity-logs.export')
            ->name('activity-logs.export-excel');

        Route::get('activity-logs/export/csv', [ActivityLogController::class, 'exportCsv'])
            ->middleware('can:activity-logs.export')
            ->name('activity-logs.export-csv');

        Route::get('activity-logs/{activity}', [ActivityLogController::class, 'show'])
            ->whereNumber('activity')
            ->middleware('can:activity-logs.show')
            ->name('activity-logs.show');
    });

    // User Management
    Route::middleware(['throttle:60,1'])->group(function () {
        // Export route - highest priority
        Route::get('users/export/csv', [\App\Http\Controllers\UserController::class, 'export'])
            ->middleware('can:users.export')
            ->name('users.export');

        Route::get('users', [\App\Http\Controllers\UserController::class, 'index'])
            ->middleware('can:users.view')
            ->name('users.index');

        Route::get('users/create', [\App\Http\Controllers\UserController::class, 'create'])
            ->middleware('can:users.create')
            ->name('users.create');

        Route::post('users', [\App\Http\Controllers\UserController::class, 'store'])
            ->middleware('can:users.store')
            ->name('users.store');

        Route::get('users/{user}', [\App\Http\Controllers\UserController::class, 'show'])
            ->middleware('can:users.show')
            ->name('users.show');

        Route::get('users/{user}/edit', [\App\Http\Controllers\UserController::class, 'edit'])
            ->middleware('can:users.edit')
            ->name('users.edit');

        Route::put('users/{user}', [\App\Http\Controllers\UserController::class, 'update'])
            ->middleware('can:users.update')
            ->name('users.update');

        Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])
            ->middleware('can:users.destroy')
            ->name('users.destroy');

        Route::get('notifications/preferences', [NotificationPreferenceAdminController::class, 'index'])
            ->middleware('can:users.update')
            ->name('notifications.preferences.index');

        Route::patch('notifications/preferences/{user}', [NotificationPreferenceAdminController::class, 'update'])
            ->middleware('can:users.update')
            ->name('notifications.preferences.update');

        // Export route - highest priority
        Route::get('roles/export/csv', [\App\Http\Controllers\RoleController::class, 'export'])
            ->middleware('can:roles.export')
            ->name('roles.export');

        Route::get('roles', [\App\Http\Controllers\RoleController::class, 'index'])
            ->middleware('can:roles.view')
            ->name('roles.index');

        Route::get('roles/create', [\App\Http\Controllers\RoleController::class, 'create'])
            ->middleware('can:roles.create')
            ->name('roles.create');

        Route::post('roles', [\App\Http\Controllers\RoleController::class, 'store'])
            ->middleware('can:roles.store')
            ->name('roles.store');

        Route::get('roles/{role}', [\App\Http\Controllers\RoleController::class, 'show'])
            ->middleware('can:roles.show')
            ->name('roles.show');

        Route::get('roles/{role}/edit', [\App\Http\Controllers\RoleController::class, 'edit'])
            ->middleware('can:roles.edit')
            ->name('roles.edit');

        Route::put('roles/{role}', [\App\Http\Controllers\RoleController::class, 'update'])
            ->middleware('can:roles.update')
            ->name('roles.update');

        Route::delete('roles/{role}', [\App\Http\Controllers\RoleController::class, 'destroy'])
            ->middleware('can:roles.destroy')
            ->name('roles.destroy');

        // Export route - highest priority
        Route::get('permissions/export/csv', [\App\Http\Controllers\PermissionController::class, 'export'])
            ->middleware('can:permissions.export')
            ->name('permissions.export');

        Route::get('permissions', [\App\Http\Controllers\PermissionController::class, 'index'])
            ->middleware('can:permissions.view')
            ->name('permissions.index');

        Route::get('permissions/{permission}', [\App\Http\Controllers\PermissionController::class, 'show'])
            ->middleware('can:permissions.show')
            ->name('permissions.show');
    });

    // In-app notifications list and actions
    Route::get('notifications', [\App\Http\Controllers\NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::post('notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])
        ->whereUuid('notification')
        ->name('notifications.read');
    Route::post('notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');

});

require __DIR__.'/help.php';
require __DIR__.'/settings.php';
