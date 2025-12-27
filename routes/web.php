<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CargoTypeController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DailyTruckStatusController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DistanceController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\DriverPerformanceController;
use App\Http\Controllers\DriverSafetyController;
use App\Http\Controllers\DriverTruckController;
use App\Http\Controllers\FleetAnalyticsController;
use App\Http\Controllers\FuelController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MaintenanceTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationFeedController;
use App\Http\Controllers\NotificationPreferenceAdminController;
use App\Http\Controllers\OperationController;
use App\Http\Controllers\OutsourceController;
use App\Http\Controllers\OutsourcePerformanceController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PlaceController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\StatusTypeController;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleTypeController;
use App\Http\Controllers\WoredaController;
use App\Http\Controllers\ZoneController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => false, // Registration disabled - only admin can create users
    ]);
})->name('home');

Route::middleware('auth')->group(function () {
    Route::middleware('throttle:60,1')->group(function () {
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // Fleet analytics cockpit
        Route::get('analytics/cockpit', [FleetAnalyticsController::class, 'index'])
            ->name('analytics.cockpit');

        // Trucks
        Route::get('trucks', [TruckController::class, 'index'])
            ->middleware('can:trucks.view')
            ->name('trucks.index');

        Route::get('trucks/create', [TruckController::class, 'create'])
            ->middleware('can:trucks.create')
            ->name('trucks.create');

        Route::post('trucks', [TruckController::class, 'store'])
            ->middleware(['can:trucks.store'])
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

        Route::get('trucks/{truck}/status-history', [TruckController::class, 'statusHistory'])
            ->name('trucks.status-history');

        // Driver-truck assignments
        Route::get('driver-trucks', [DriverTruckController::class, 'index'])
            ->middleware('can:driver-trucks.view')
            ->name('driver-trucks.index');

        Route::get('driver-trucks/create', [DriverTruckController::class, 'create'])
            ->middleware('can:driver-trucks.create')
            ->name('driver-trucks.create');

        Route::post('driver-trucks', [DriverTruckController::class, 'store'])
            ->middleware(['can:driver-trucks.create'])
            ->name('driver-trucks.store');

        Route::get('driver-trucks/{driverTruck}', [DriverTruckController::class, 'show'])
            ->middleware('can:driver-trucks.view')
            ->name('driver-trucks.show');

        Route::get('driver-trucks/{driverTruck}/edit', [DriverTruckController::class, 'edit'])
            ->middleware('can:driver-trucks.edit')
            ->name('driver-trucks.edit');

        Route::put('driver-trucks/{driverTruck}', [DriverTruckController::class, 'update'])
            ->middleware('can:driver-trucks.edit')
            ->name('driver-trucks.update');

        Route::delete('driver-trucks/{driverTruck}', [DriverTruckController::class, 'destroy'])
            ->middleware('can:driver-trucks.destroy')
            ->name('driver-trucks.destroy');

        Route::get('driver-trucks/{driverTruck}/detach', [DriverTruckController::class, 'detach'])
            ->middleware('can:driver-trucks.detach')
            ->name('driver-trucks.detach');

        Route::post('driver-trucks/{driverTruck}/detach', [DriverTruckController::class, 'updateDetach'])
            ->middleware('can:driver-trucks.detach')
            ->name('driver-trucks.update-detach');

        // Status per-day view
        Route::get('statuses/{status}/daily', [StatusController::class, 'daily'])
            ->name('statuses.daily');

        // Drivers
        Route::get('drivers', [DriverController::class, 'index'])
            ->middleware('can:drivers.view')
            ->name('drivers.index');

        Route::get('drivers/create', [DriverController::class, 'create'])
            ->middleware('can:drivers.create')
            ->name('drivers.create');

        Route::post('drivers', [DriverController::class, 'store'])
            ->middleware(['can:drivers.store'])
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

        // Performances
        Route::get('performances', [PerformanceController::class, 'index'])
            ->middleware('can:performances.view')
            ->name('performances.index');

        Route::get('performances/create', [PerformanceController::class, 'create'])
            ->middleware('can:performances.create')
            ->name('performances.create');

        Route::post('performances', [PerformanceController::class, 'store'])
            ->middleware(['can:performances.store'])
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

        Route::get('performances/status/list', [PerformanceController::class, 'statusList'])
            ->name('performances.status.list');

        Route::get('performances/calculate-distance', [PerformanceController::class, 'calculateDistance'])
            ->name('performances.calculate-distance');

        // Maintenance
        Route::get('maintenance-overview', [MaintenanceController::class, 'overview'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.overview');

        Route::get('maintenance/alerts', [MaintenanceController::class, 'alerts'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.alerts');

        Route::get('maintenance', [MaintenanceController::class, 'index'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.index');

        Route::get('maintenance/create', [MaintenanceController::class, 'create'])
            ->middleware('can:maintenance.create')
            ->name('maintenance.create');

        Route::post('maintenance', [MaintenanceController::class, 'store'])
            ->middleware('can:maintenance.store')
            ->name('maintenance.store');

        Route::get('maintenance/{maintenance}', [MaintenanceController::class, 'show'])
            ->middleware('can:maintenance.show')
            ->name('maintenance.show');

        Route::get('maintenance/{maintenance}/edit', [MaintenanceController::class, 'edit'])
            ->middleware('can:maintenance.edit')
            ->name('maintenance.edit');

        Route::put('maintenance/{maintenance}', [MaintenanceController::class, 'update'])
            ->middleware('can:maintenance.update')
            ->name('maintenance.update');

        Route::delete('maintenance/{maintenance}', [MaintenanceController::class, 'destroy'])
            ->middleware('can:maintenance.destroy')
            ->name('maintenance.destroy');

        Route::get('maintenance/overdue/list', [MaintenanceController::class, 'overdue'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.overdue');

        Route::get('maintenance/upcoming/list', [MaintenanceController::class, 'upcoming'])
            ->middleware('can:maintenance.view')
            ->name('maintenance.upcoming');

        Route::post('maintenance/{maintenance}/complete', [MaintenanceController::class, 'complete'])
            ->middleware('can:maintenance.update')
            ->name('maintenance.complete');

        // Maintenance types
        Route::delete('maintenance-types/bulk-delete', [MaintenanceTypeController::class, 'bulkDelete'])
            ->middleware('can:maintenance-types.destroy')
            ->name('maintenance-types.bulk-delete');

        Route::patch('maintenance-types/bulk-activate', [MaintenanceTypeController::class, 'bulkActivate'])
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.bulk-activate');

        Route::patch('maintenance-types/bulk-deactivate', [MaintenanceTypeController::class, 'bulkDeactivate'])
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.bulk-deactivate');

        Route::get('maintenance-types', [MaintenanceTypeController::class, 'index'])
            ->middleware('can:maintenance-types.view')
            ->name('maintenance-types.index');

        Route::get('maintenance-types/create', [MaintenanceTypeController::class, 'create'])
            ->middleware('can:maintenance-types.create')
            ->name('maintenance-types.create');

        Route::post('maintenance-types', [MaintenanceTypeController::class, 'store'])
            ->middleware('can:maintenance-types.store')
            ->name('maintenance-types.store');

        Route::get('maintenance-types/{maintenanceType}', [MaintenanceTypeController::class, 'show'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.show')
            ->name('maintenance-types.show');

        Route::get('maintenance-types/{maintenanceType}/edit', [MaintenanceTypeController::class, 'edit'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.edit')
            ->name('maintenance-types.edit');

        Route::put('maintenance-types/{maintenanceType}', [MaintenanceTypeController::class, 'update'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.update')
            ->name('maintenance-types.update');

        Route::delete('maintenance-types/{maintenanceType}', [MaintenanceTypeController::class, 'destroy'])
            ->whereNumber('maintenanceType')
            ->middleware('can:maintenance-types.destroy')
            ->name('maintenance-types.destroy');

        // Fuel
        Route::get('fuel', [FuelController::class, 'index'])
            ->middleware('can:fuel.view')
            ->name('fuel.index');

        Route::get('fuel/create', [FuelController::class, 'create'])
            ->middleware('can:fuel.create')
            ->name('fuel.create');

        Route::post('fuel', [FuelController::class, 'store'])
            ->middleware('can:fuel.store')
            ->name('fuel.store');

        Route::get('fuel/{fuel}', [FuelController::class, 'show'])
            ->middleware('can:fuel.show')
            ->name('fuel.show');

        Route::get('fuel/{fuel}/edit', [FuelController::class, 'edit'])
            ->middleware('can:fuel.edit')
            ->name('fuel.edit');

        Route::put('fuel/{fuel}', [FuelController::class, 'update'])
            ->middleware('can:fuel.update')
            ->name('fuel.update');

        Route::delete('fuel/{fuel}', [FuelController::class, 'destroy'])
            ->middleware('can:fuel.destroy')
            ->name('fuel.destroy');

        Route::get('fuel/analysis', [FuelController::class, 'analysis'])
            ->middleware('can:fuel.view')
            ->name('fuel.analysis');

        Route::post('fuel/generate-analysis', [FuelController::class, 'generateAnalysis'])
            ->middleware('can:fuel.view')
            ->name('fuel.generate.analysis');

        // Driver performance
        Route::resource('driver-performance', DriverPerformanceController::class);

        Route::get('driver-performance/analytics', [DriverPerformanceController::class, 'analytics'])
            ->name('driver-performance.analytics');

        Route::get('driver-performance/top-performers', [DriverPerformanceController::class, 'topPerformers'])
            ->name('driver-performance.top-performers');

        // Driver safety
        Route::resource('driver-safety', DriverSafetyController::class);

        Route::get('driver-safety/analytics', [DriverSafetyController::class, 'analytics'])
            ->name('driver-safety.analytics');

        Route::get('driver-safety/drivers-with-issues', [DriverSafetyController::class, 'driversWithIssues'])
            ->name('driver-safety.drivers-with-issues');

        // Cargo management
        Route::resource('cargo-types', CargoTypeController::class)
            ->middlewareFor('index', 'can:cargotypes.view')
            ->middlewareFor('show', 'can:cargotypes.show')
            ->middlewareFor('create', 'can:cargotypes.create')
            ->middlewareFor('store', 'can:cargotypes.store')
            ->middlewareFor('edit', 'can:cargotypes.edit')
            ->middlewareFor('update', 'can:cargotypes.update')
            ->middlewareFor('destroy', 'can:cargotypes.destroy');

        Route::get('cargo-types/statistics', [CargoTypeController::class, 'statistics'])
            ->middleware('can:cargotypes.view')
            ->name('cargo-types.statistics');

        Route::get('cargo-types/by-category', [CargoTypeController::class, 'byCategory'])
            ->middleware('can:cargotypes.view')
            ->name('cargo-types.by-category');

        // Operations
        Route::get('operations', [OperationController::class, 'index'])
            ->middleware('can:operations.view')
            ->name('operations.index');

        Route::get('operations/search', [OperationController::class, 'search'])
            ->name('operations.search');

        Route::get('operations/create', [OperationController::class, 'create'])
            ->middleware('can:operations.create')
            ->name('operations.create');

        Route::post('operations', [OperationController::class, 'store'])
            ->middleware('can:operations.store')
            ->name('operations.store');

        Route::get('operations/{operation}', [OperationController::class, 'show'])
            ->middleware('can:operations.show')
            ->name('operations.show');

        Route::get('operations/{operation}/edit', [OperationController::class, 'edit'])
            ->middleware('can:operations.edit')
            ->name('operations.edit');

        Route::put('operations/{operation}', [OperationController::class, 'update'])
            ->middleware('can:operations.update')
            ->name('operations.update');

        Route::delete('operations/{operation}', [OperationController::class, 'destroy'])
            ->middleware('can:operations.destroy')
            ->name('operations.destroy');

        Route::post('operations/{operation}/deactivate', [OperationController::class, 'deactivate'])
            ->middleware('can:operations.deactivate')
            ->name('operations.deactivate');

        Route::post('operations/{operation}/close', [OperationController::class, 'close'])
            ->middleware('can:operations.close')
            ->name('operations.close');

        Route::post('operations/{operation}/reopen', [OperationController::class, 'reopen'])
            ->middleware('can:operations.reopen')
            ->name('operations.reopen');

        Route::get('operations/available/list', [OperationController::class, 'availableOperations'])
            ->middleware('can:operations.available')
            ->name('operations.available');

        // Customers
        Route::get('customers', [CustomerController::class, 'index'])
            ->middleware('can:customers.view')
            ->name('customers.index');

        Route::get('customers/create', [CustomerController::class, 'create'])
            ->middleware('can:customers.create')
            ->name('customers.create');

        Route::post('customers', [CustomerController::class, 'store'])
            ->middleware('can:customers.store')
            ->name('customers.store');

        Route::get('customers/{customer}', [CustomerController::class, 'show'])
            ->middleware('can:customers.show')
            ->name('customers.show');

        Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])
            ->middleware('can:customers.edit')
            ->name('customers.edit');

        Route::put('customers/{customer}', [CustomerController::class, 'update'])
            ->middleware('can:customers.update')
            ->name('customers.update');

        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])
            ->middleware('can:customers.destroy')
            ->name('customers.destroy');

        Route::post('customers/{customer}/deactivate', [CustomerController::class, 'deactivate'])
            ->middleware('can:customers.deactivate')
            ->name('customers.deactivate');

        Route::get('customers/active/list', [CustomerController::class, 'activeCustomers'])
            ->middleware('can:customers.active')
            ->name('customers.active');

        // Geographic management
        Route::resource('regions', RegionController::class)
            ->middlewareFor('index', 'can:regions.view')
            ->middlewareFor('show', 'can:regions.show')
            ->middlewareFor('create', 'can:regions.create')
            ->middlewareFor('store', 'can:regions.store')
            ->middlewareFor('edit', 'can:regions.edit')
            ->middlewareFor('update', 'can:regions.update')
            ->middlewareFor('destroy', 'can:regions.destroy');

        Route::post('regions/{region}/deactivate', [RegionController::class, 'deactivate'])
            ->middleware('can:regions.deactivate')
            ->name('regions.deactivate');

        Route::get('regions/active/list', [RegionController::class, 'activeRegions'])
            ->middleware('can:regions.active')
            ->name('regions.active');

        Route::resource('zones', ZoneController::class)
            ->middlewareFor('show', 'can:zones.show')
            ->middlewareFor('create', 'can:zones.create')
            ->middlewareFor('store', 'can:zones.store')
            ->middlewareFor('edit', 'can:zones.edit')
            ->middlewareFor('update', 'can:zones.update')
            ->middlewareFor('destroy', 'can:zones.destroy');

        Route::post('zones/{zone}/deactivate', [ZoneController::class, 'deactivate'])
            ->middleware('can:zones.deactivate')
            ->name('zones.deactivate');

        Route::get('zones/active/list', [ZoneController::class, 'activeZones'])
            ->middleware('can:zones.active')
            ->name('zones.active');

        Route::resource('woredas', WoredaController::class)
            ->middlewareFor('index', 'can:woredas.view')
            ->middlewareFor('show', 'can:woredas.show')
            ->middlewareFor('create', 'can:woredas.create')
            ->middlewareFor('store', 'can:woredas.store')
            ->middlewareFor('edit', 'can:woredas.edit')
            ->middlewareFor('update', 'can:woredas.update')
            ->middlewareFor('destroy', 'can:woredas.destroy');

        Route::post('woredas/{woreda}/deactivate', [WoredaController::class, 'deactivate'])
            ->middleware('can:woredas.deactivate')
            ->name('woredas.deactivate');

        Route::get('woredas/active/list', [WoredaController::class, 'activeWoredas'])
            ->middleware('can:woredas.active')
            ->name('woredas.active');

        Route::get('places/search', [PlaceController::class, 'search'])
            ->middleware('can:places.search')
            ->name('places.search');

        Route::resource('places', PlaceController::class)
            ->middlewareFor('index', 'can:places.view')
            ->middlewareFor('show', 'can:places.show')
            ->middlewareFor('create', 'can:places.create')
            ->middlewareFor('store', 'can:places.store')
            ->middlewareFor('edit', 'can:places.edit')
            ->middlewareFor('update', 'can:places.update')
            ->middlewareFor('destroy', 'can:places.destroy');

        Route::post('places/{place}/deactivate', [PlaceController::class, 'deactivate'])
            ->middleware('can:places.deactivate')
            ->name('places.deactivate');

        Route::get('places/active/list', [PlaceController::class, 'activePlaces'])
            ->middleware('can:places.active')
            ->name('places.active');

        Route::resource('distances', DistanceController::class)
            ->middlewareFor('index', 'can:distances.view')
            ->middlewareFor('show', 'can:distances.show')
            ->middlewareFor('create', 'can:distances.create')
            ->middlewareFor('store', 'can:distances.store')
            ->middlewareFor('edit', 'can:distances.edit')
            ->middlewareFor('update', 'can:distances.update')
            ->middlewareFor('destroy', 'can:distances.destroy');

        Route::post('distances/{distance}/deactivate', [DistanceController::class, 'deactivate'])
            ->middleware('can:distances.deactivate')
            ->name('distances.deactivate');

        Route::get('distances/active/list', [DistanceController::class, 'activeDistances'])
            ->middleware('can:distances.active')
            ->name('distances.active');

        Route::get('vehicletypes', [VehicleTypeController::class, 'index'])
            ->middleware('can:vehicletypes.view')
            ->name('vehicletypes.index');

        Route::get('vehicletypes/create', [VehicleTypeController::class, 'create'])
            ->middleware('can:vehicletypes.create')
            ->name('vehicletypes.create');

        Route::post('vehicletypes', [VehicleTypeController::class, 'store'])
            ->middleware('can:vehicletypes.store')
            ->name('vehicletypes.store');

        Route::get('vehicletypes/{vehicletype}', [VehicleTypeController::class, 'show'])
            ->middleware('can:vehicletypes.show')
            ->name('vehicletypes.show');

        Route::get('vehicletypes/{vehicletype}/edit', [VehicleTypeController::class, 'edit'])
            ->middleware('can:vehicletypes.edit')
            ->name('vehicletypes.edit');

        Route::put('vehicletypes/{vehicletype}', [VehicleTypeController::class, 'update'])
            ->middleware('can:vehicletypes.update')
            ->name('vehicletypes.update');

        Route::delete('vehicletypes/{vehicletype}', [VehicleTypeController::class, 'destroy'])
            ->middleware('can:vehicletypes.destroy')
            ->name('vehicletypes.destroy');

        Route::resource('statustypes', StatusTypeController::class);

        Route::resource('statuses', StatusController::class);

        Route::get('truck-status-board', [DailyTruckStatusController::class, 'index'])
            ->middleware('can:truck-status-board.view')
            ->name('truck-status-board.index');

        Route::get('truck-status-board/trucks/{truck}', [DailyTruckStatusController::class, 'show'])
            ->middleware('can:truck-status-board.view')
            ->name('truck-status-board.trucks.show');

        Route::post('truck-status-board', [DailyTruckStatusController::class, 'store'])
            ->middleware('can:truck-status-board.update')
            ->name('truck-status-board.store');

        Route::resource('outsources', OutsourceController::class);

        Route::resource('outsource-performances', OutsourcePerformanceController::class);

        // Reports
        Route::get('reports/maintenance', [ReportController::class, 'maintenance'])
            ->middleware('can:reports.maintenance.view')
            ->name('reports.maintenance');

        Route::get('reports/fuel-efficiency', [ReportController::class, 'fuelEfficiency'])
            ->middleware('can:reports.fuel-efficiency.view')
            ->name('reports.fuel-efficiency');

        Route::get('reports/customer-profitability', [ReportController::class, 'customerProfitability'])
            ->middleware('can:reports.customer-profitability.view')
            ->name('reports.customer-profitability');

        Route::get('reports/outsource-performance', [ReportController::class, 'outsourcePerformanceReport'])
            ->middleware('can:reports.outsource-performance.view')
            ->name('reports.outsource-performance');

        Route::get('reports/outsource-performance/export/{format}', [ReportController::class, 'outsourcePerformanceExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.outsource-performance.export')
            ->name('reports.outsource-performance.export');

        Route::get('reports/operation-profitability', [ReportController::class, 'operationProfitability'])
            ->middleware('can:reports.operation-profitability.view')
            ->name('reports.operation-profitability');

        Route::get('reports/operational-profitability', function (Request $request) {
            return redirect()->route('reports.operation-profitability', $request->query());
        })
            ->middleware('can:reports.operation-profitability.view')
            ->name('reports.operational-profitability');

        Route::get('reports/geography-heatmaps', [ReportController::class, 'geographyHeatmaps'])
            ->middleware('can:reports.geography-heatmaps.view')
            ->name('reports.geography-heatmaps');

        Route::get('reports/truck-grading', [ReportController::class, 'truckGrading'])
            ->middleware('can:reports.truck-grading.view')
            ->name('reports.truck-grading');

        Route::get('reports/driver-grading', [ReportController::class, 'driverGrading'])
            ->middleware('can:reports.driver-grading.view')
            ->name('reports.driver-grading');

        Route::get('reports/driver-truck-grading', [ReportController::class, 'driverTruckGrading'])
            ->middleware('can:reports.driver-truck-grading.view')
            ->name('reports.driver-truck-grading');

        Route::get('reports/driver-safety', [ReportController::class, 'driverSafety'])
            ->middleware('can:reports.driver-safety.view')
            ->name('reports.driver-safety');

        Route::get('reports/performance-all', [ReportController::class, 'performanceAll'])
            ->middleware('can:reports.performance-all.view')
            ->name('reports.performance-all');

        Route::get('reports/performance-all/export/{format}', [ReportController::class, 'performanceAllExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.performance-all.export')
            ->name('reports.performance-all.export');

        Route::get('reports/performance-by-driver', [ReportController::class, 'performanceByDriver'])
            ->middleware('can:reports.performance-by-driver.view')
            ->name('reports.performance-by-driver');

        Route::get('reports/performance-by-driver/export/{format}', [ReportController::class, 'performanceByDriverExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.performance-by-driver.export')
            ->name('reports.performance-by-driver.export');

        Route::get('reports/performance-by-truck', [ReportController::class, 'performanceByTruck'])
            ->middleware('can:reports.performance-by-truck.view')
            ->name('reports.performance-by-truck');

        Route::get('reports/performance-by-truck/export/{format}', [ReportController::class, 'performanceByTruckExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.performance-by-truck.export')
            ->name('reports.performance-by-truck.export');

        Route::get('reports/performance-by-status', [ReportController::class, 'performanceByStatus'])
            ->middleware('can:reports.performance-by-status.view')
            ->name('reports.performance-by-status');

        Route::get('reports/daily-status', [ReportController::class, 'dailyStatus'])
            ->middleware('can:reports.daily-status.view')
            ->name('reports.daily-status');

        Route::get('reports/daily-status/export/{format}', [ReportController::class, 'dailyStatusExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.daily-status.export')
            ->name('reports.daily-status.export');

        Route::get('reports/driver-truck-attach-detach', [ReportController::class, 'driverTruckAttachDetach'])
            ->middleware('can:reports.attach-detach.view')
            ->name('reports.attach-detach');

        Route::get('reports/route-profitability', [ReportController::class, 'routeProfitability'])
            ->middleware('can:reports.route-profitability.view')
            ->name('reports.route-profitability');

        Route::get('reports/load-factor-utilization', [ReportController::class, 'loadFactorUtilization'])
            ->middleware('can:reports.load-factor-utilization.view')
            ->name('reports.load-factor-utilization');

        Route::get('reports/load-factor-utilization/export/{format}', [ReportController::class, 'loadFactorUtilizationExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.load-factor-utilization.export')
            ->name('reports.load-factor-utilization.export');

        Route::get('reports/cost-per-kilometer', [ReportController::class, 'costPerKilometer'])
            ->middleware('can:reports.cost-per-kilometer.view')
            ->name('reports.cost-per-kilometer');

        Route::get('reports/cost-per-kilometer/export/{format}', [ReportController::class, 'costPerKilometerExport'])
            ->whereIn('format', ['csv', 'xlsx', 'pdf'])
            ->middleware('can:reports.cost-per-kilometer.export')
            ->name('reports.cost-per-kilometer.export');

        // Activity logs
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

        // Users
        Route::get('users/export/csv', [UserController::class, 'export'])
            ->middleware('can:users.export')
            ->name('users.export');

        Route::get('users', [UserController::class, 'index'])
            ->middleware('can:users.view')
            ->name('users.index');

        Route::get('users/create', [UserController::class, 'create'])
            ->middleware('can:users.create')
            ->name('users.create');

        Route::post('users', [UserController::class, 'store'])
            ->middleware('can:users.store')
            ->name('users.store');

        Route::get('users/{user}', [UserController::class, 'show'])
            ->middleware('can:users.show')
            ->name('users.show');

        Route::get('users/{user}/edit', [UserController::class, 'edit'])
            ->middleware('can:users.edit')
            ->name('users.edit');

        Route::put('users/{user}', [UserController::class, 'update'])
            ->middleware('can:users.update')
            ->name('users.update');

        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->middleware('can:users.destroy')
            ->name('users.destroy');

        Route::get('notifications/preferences', [NotificationPreferenceAdminController::class, 'index'])
            ->middleware('can:users.update')
            ->name('notifications.preferences.index');

        Route::patch('notifications/preferences/{user}', [NotificationPreferenceAdminController::class, 'update'])
            ->middleware('can:users.update')
            ->name('notifications.preferences.update');

        // Roles
        Route::get('roles/export/csv', [RoleController::class, 'export'])
            ->middleware('can:roles.export')
            ->name('roles.export');

        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('can:roles.view')
            ->name('roles.index');

        Route::get('roles/create', [RoleController::class, 'create'])
            ->middleware('can:roles.create')
            ->name('roles.create');

        Route::post('roles', [RoleController::class, 'store'])
            ->middleware('can:roles.store')
            ->name('roles.store');

        Route::get('roles/{role}', [RoleController::class, 'show'])
            ->middleware('can:roles.show')
            ->name('roles.show');

        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])
            ->middleware('can:roles.edit')
            ->name('roles.edit');

        Route::put('roles/{role}', [RoleController::class, 'update'])
            ->middleware('can:roles.update')
            ->name('roles.update');

        Route::delete('roles/{role}', [RoleController::class, 'destroy'])
            ->middleware('can:roles.destroy')
            ->name('roles.destroy');

        // Permissions
        Route::get('permissions/export/csv', [PermissionController::class, 'export'])
            ->middleware('can:permissions.export')
            ->name('permissions.export');

        Route::get('permissions', [PermissionController::class, 'index'])
            ->middleware('can:permissions.view')
            ->name('permissions.index');

        Route::get('permissions/{permission}', [PermissionController::class, 'show'])
            ->middleware('can:permissions.show')
            ->name('permissions.show');

        // Notifications
        Route::get('notifications/feed', [NotificationFeedController::class, 'index'])
            ->name('notifications.feed');

        Route::get('notifications', [NotificationController::class, 'index'])
            ->name('notifications.index');

        Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
            ->whereUuid('notification')
            ->name('notifications.read');

        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])
            ->name('notifications.read-all');
    });
});

require __DIR__.'/help.php';
require __DIR__.'/settings.php';
