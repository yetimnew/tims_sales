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

    // Trucks with rate limiting
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::resource('trucks', TruckController::class);
        Route::post('trucks/{truck}/deactivate', [TruckController::class, 'deactivate'])->name('trucks.deactivate');
        Route::get('trucks/free/list', [TruckController::class, 'freeTrucks'])->name('trucks.free');
    });

    // Drivers
    Route::resource('drivers', DriverController::class);
    Route::post('drivers/{driver}/deactivate', [DriverController::class, 'deactivate'])->name('drivers.deactivate');

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
