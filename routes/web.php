<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\PerformanceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => false, // Registration disabled - only admin can create users
    ]);
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Trucks with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // Export route - highest priority
        Route::get('trucks/export/csv', [TruckController::class, 'export'])
            ->middleware('can:trucks.export')
            ->name('trucks.export');

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

        Route::get('trucks/free/list', [TruckController::class, 'freeTrucks'])
            ->middleware('can:trucks.free')
            ->name('trucks.free');
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
        // Export route - highest priority
        Route::get('drivers/export/csv', [DriverController::class, 'export'])
            ->middleware('can:drivers.export')
            ->name('drivers.export');

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

        Route::get('drivers/{driver}', [DriverController::class, 'show'])
            ->middleware('can:drivers.show')
            ->name('drivers.show');

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
            ->middleware('can:drivers.update')
            ->name('drivers.deactivate');
    });

    // Performances with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // Export route - highest priority
        Route::get('performances/export/csv', [PerformanceController::class, 'export'])
            ->middleware('can:performances.export')
            ->name('performances.export');

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
            ->middleware('can:performances.show')
            ->name('performances.show');

        Route::get('performances/{performance}/edit', [PerformanceController::class, 'edit'])
            ->middleware('can:performances.edit')
            ->name('performances.edit');

        Route::put('performances/{performance}', [PerformanceController::class, 'update'])
            ->middleware('can:performances.update')
            ->name('performances.update');

        Route::delete('performances/{performance}', [PerformanceController::class, 'destroy'])
            ->middleware('can:performances.destroy')
            ->name('performances.destroy');

        Route::post('performances/{performance}/deactivate', [PerformanceController::class, 'deactivate'])
            ->middleware('can:performances.deactivate')
            ->name('performances.deactivate');

        Route::get('performances/active/list', [PerformanceController::class, 'activePerformances'])
            ->middleware('can:performances.active')
            ->name('performances.active');

        // Additional performance routes
        Route::get('performances/status/list', [PerformanceController::class, 'statusList'])
            ->name('performances.status.list');
        Route::post('performances/calculate-distance', [PerformanceController::class, 'ajaxRequestPost'])
            ->name('performances.calculate.distance');
    });

    // Maintenance Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('maintenance/export/csv', [\App\Http\Controllers\MaintenanceController::class, 'export'])
            ->middleware('can:maintenance.export')
            ->name('maintenance.export');

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

    // Fuel Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('fuel/export/csv', [\App\Http\Controllers\FuelController::class, 'export'])
            ->middleware('can:fuel.export')
            ->name('fuel.export');

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

    // Financial Management
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('financial/export/csv', [\App\Http\Controllers\FinancialController::class, 'export'])
            ->middleware('can:financial.export')
            ->name('financial.export');

        Route::get('financial', [\App\Http\Controllers\FinancialController::class, 'index'])
            ->middleware('can:financial.view')
            ->name('financial.index');

        Route::get('financial/create', [\App\Http\Controllers\FinancialController::class, 'create'])
            ->middleware('can:financial.create')
            ->name('financial.create');

        Route::post('financial', [\App\Http\Controllers\FinancialController::class, 'store'])
            ->middleware('can:financial.store')
            ->name('financial.store');

        Route::get('financial/{financial}', [\App\Http\Controllers\FinancialController::class, 'show'])
            ->middleware('can:financial.show')
            ->name('financial.show');

        Route::get('financial/{financial}/edit', [\App\Http\Controllers\FinancialController::class, 'edit'])
            ->middleware('can:financial.edit')
            ->name('financial.edit');

        Route::put('financial/{financial}', [\App\Http\Controllers\FinancialController::class, 'update'])
            ->middleware('can:financial.update')
            ->name('financial.update');

        Route::delete('financial/{financial}', [\App\Http\Controllers\FinancialController::class, 'destroy'])
            ->middleware('can:financial.destroy')
            ->name('financial.destroy');

        Route::get('financial/analytics', [\App\Http\Controllers\FinancialController::class, 'analytics'])
            ->middleware('can:financial.view')
            ->name('financial.analytics');

        Route::get('financial/profit-loss', [\App\Http\Controllers\FinancialController::class, 'profitLoss'])
            ->middleware('can:financial.view')
            ->name('financial.profit-loss');
    });

    // Route Planning and Optimization
    Route::resource('route-plans', \App\Http\Controllers\RoutePlanController::class);
    Route::post('route-plans/optimize', [\App\Http\Controllers\RoutePlanController::class, 'optimizeRoute'])->name('route-plans.optimize');
    Route::get('route-plans/analytics', [\App\Http\Controllers\RoutePlanController::class, 'analytics'])->name('route-plans.analytics');

    // Operations with rate limiting and permission middleware
    Route::middleware(['throttle:60,1'])->group(function () {
        // Export route - highest priority
        Route::get('operations/export/csv', [\App\Http\Controllers\OperationController::class, 'export'])
            ->middleware('can:operations.export')
            ->name('operations.export');

        // All other operation routes with individual permission checks
        Route::get('operations', [\App\Http\Controllers\OperationController::class, 'index'])
            ->middleware('can:operations.view')
            ->name('operations.index');

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
        Route::get('customers/export/csv', [\App\Http\Controllers\CustomerController::class, 'export'])
            ->middleware('can:customers.export')
            ->name('customers.export');

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
        Route::get('vehicletypes/export/csv', [\App\Http\Controllers\VehicleTypeController::class, 'export'])
            ->middleware('can:vehicletypes.export')
            ->name('vehicletypes.export');

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

        Route::post('truck-status-board', [\App\Http\Controllers\DailyTruckStatusController::class, 'store'])
            ->middleware('can:truck-status-board.update')
            ->name('truck-status-board.store');
    });

    // Outsourcing
    Route::resource('outsources', \App\Http\Controllers\OutsourceController::class);
    Route::resource('outsource-performances', \App\Http\Controllers\OutsourcePerformanceController::class);

    // Reports
    Route::get('reports/trucks', [\App\Http\Controllers\ReportController::class, 'trucks'])->name('reports.trucks');
    Route::get('reports/drivers', [\App\Http\Controllers\ReportController::class, 'drivers'])->name('reports.drivers');
    Route::get('reports/performances', [\App\Http\Controllers\ReportController::class, 'performances'])->name('reports.performances');
    Route::get('reports/operations', [\App\Http\Controllers\ReportController::class, 'operations'])->name('reports.operations');
    Route::get('reports/financial', [\App\Http\Controllers\ReportController::class, 'financial'])->name('reports.financial');
    Route::get('reports/maintenance', [\App\Http\Controllers\ReportController::class, 'maintenance'])->name('reports.maintenance');
    Route::get('reports/fuel-efficiency', [\App\Http\Controllers\ReportController::class, 'fuelEfficiency'])->name('reports.fuel-efficiency');
    Route::get('reports/customer-profitability', [\App\Http\Controllers\ReportController::class, 'customerProfitability'])->name('reports.customer-profitability');
    Route::get('reports/route-efficiency', [\App\Http\Controllers\ReportController::class, 'routeEfficiency'])->name('reports.route-efficiency');
    Route::get('reports/outsource-performance', [\App\Http\Controllers\ReportController::class, 'outsourcePerformanceReport'])->name('reports.outsource-performance');
    Route::get('reports/operation-profitability', [\App\Http\Controllers\ReportController::class, 'operationProfitability'])->name('reports.operation-profitability');
    Route::get('reports/capacity-load', [\App\Http\Controllers\ReportController::class, 'capacityLoadFactor'])->name('reports.capacity-load');
    Route::get('reports/geography-heatmaps', [\App\Http\Controllers\ReportController::class, 'geographyHeatmaps'])->name('reports.geography-heatmaps');
    Route::get('reports/performance-all', [\App\Http\Controllers\ReportController::class, 'performanceAll'])->name('reports.performance-all');
    Route::get('reports/performance-by-driver', [\App\Http\Controllers\ReportController::class, 'performanceByDriver'])->name('reports.performance-by-driver');
    Route::get('reports/performance-by-truck', [\App\Http\Controllers\ReportController::class, 'performanceByTruck'])->name('reports.performance-by-truck');
    Route::get('reports/performance-by-model', [\App\Http\Controllers\ReportController::class, 'performanceByModel'])->name('reports.performance-by-model');
    Route::get('reports/performance-by-status', [\App\Http\Controllers\ReportController::class, 'performanceByStatus'])->name('reports.performance-by-status');
    Route::get('reports/driver-truck-attach-detach', [\App\Http\Controllers\ReportController::class, 'driverTruckAttachDetach'])->name('reports.attach-detach');

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
});

require __DIR__.'/settings.php';
