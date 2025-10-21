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
        'canRegister' => Features::enabled(Features::registration()),
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
            ->middleware('can:trucks.store')
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
            ->middleware('can:drivers.store')
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

    // Performances
    Route::resource('performances', PerformanceController::class);
    Route::get('performances/status/list', [PerformanceController::class, 'statusList'])->name('performances.status.list');
    Route::post('performances/calculate-distance', [PerformanceController::class, 'ajaxRequestPost'])->name('performances.calculate.distance');

    // Maintenance Management
    Route::resource('maintenance', \App\Http\Controllers\MaintenanceController::class);
    Route::get('maintenance/overdue/list', [\App\Http\Controllers\MaintenanceController::class, 'overdue'])->name('maintenance.overdue');
    Route::get('maintenance/upcoming/list', [\App\Http\Controllers\MaintenanceController::class, 'upcoming'])->name('maintenance.upcoming');
    Route::post('maintenance/{maintenance}/complete', [\App\Http\Controllers\MaintenanceController::class, 'complete'])->name('maintenance.complete');

    // Fuel Management
    Route::resource('fuel', \App\Http\Controllers\FuelController::class);
    Route::get('fuel/analysis', [\App\Http\Controllers\FuelController::class, 'analysis'])->name('fuel.analysis');
    Route::post('fuel/generate-analysis', [\App\Http\Controllers\FuelController::class, 'generateAnalysis'])->name('fuel.generate.analysis');

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
    Route::resource('financial', \App\Http\Controllers\FinancialController::class);
    Route::get('financial/analytics', [\App\Http\Controllers\FinancialController::class, 'analytics'])->name('financial.analytics');
    Route::get('financial/profit-loss', [\App\Http\Controllers\FinancialController::class, 'profitLoss'])->name('financial.profit-loss');

    // Route Planning and Optimization
    Route::resource('route-plans', \App\Http\Controllers\RoutePlanController::class);
    Route::post('route-plans/optimize', [\App\Http\Controllers\RoutePlanController::class, 'optimizeRoute'])->name('route-plans.optimize');
    Route::get('route-plans/analytics', [\App\Http\Controllers\RoutePlanController::class, 'analytics'])->name('route-plans.analytics');

    // Operations
    Route::resource('operations', \App\Http\Controllers\OperationController::class);

    // Customers
    Route::resource('customers', \App\Http\Controllers\CustomerController::class);

    // Geographic Management
    Route::resource('regions', \App\Http\Controllers\RegionController::class);
    Route::resource('zones', \App\Http\Controllers\ZoneController::class);
    Route::resource('woredas', \App\Http\Controllers\WoredaController::class);
    Route::resource('places', \App\Http\Controllers\PlaceController::class);
    Route::resource('distances', \App\Http\Controllers\DistanceController::class);

    // Vehicle Types
    Route::resource('vehicletypes', \App\Http\Controllers\VehicleTypeController::class);

    // Status Management
    Route::resource('statustypes', \App\Http\Controllers\StatusTypeController::class);
    Route::resource('statuses', \App\Http\Controllers\StatusController::class);

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

    // User Management
    Route::resource('users', \App\Http\Controllers\UserController::class);
    Route::resource('roles', \App\Http\Controllers\RoleController::class);
    Route::resource('permissions', \App\Http\Controllers\PermissionController::class);
});

require __DIR__.'/settings.php';
