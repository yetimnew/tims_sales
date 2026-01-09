<?php

use App\Http\Controllers\Api\DriverAuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverLocationController;
use App\Http\Controllers\Api\DriverMaintenanceController;
use App\Http\Controllers\Api\DriverNotificationController;
use App\Http\Controllers\Api\DriverPerformanceController;
use App\Http\Controllers\Api\DriverStatusController;
use App\Http\Controllers\Api\DriverTripController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/driver/login', [DriverAuthController::class, 'login'])->middleware('throttle:5,1');

// Protected routes - require authentication
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Authentication
    Route::post('/driver/logout', [DriverAuthController::class, 'logout']);

    // Driver profile
    Route::get('/driver/profile', [DriverController::class, 'profile']);

    // Performance
    Route::get('/driver/performance', [DriverPerformanceController::class, 'index']);

    // Status management
    Route::post('/driver/status', [DriverStatusController::class, 'update']);
    Route::get('/driver/status/history', [DriverStatusController::class, 'history']);

    // Location tracking
    Route::post('/driver/location', [DriverLocationController::class, 'store']);
    Route::get('/driver/location/history', [DriverLocationController::class, 'history']);

    // Truck information
    Route::get('/driver/truck', [DriverController::class, 'truck']);

    // Trip management
    Route::get('/driver/trips', [DriverTripController::class, 'index']);
    Route::get('/driver/trips/{id}', [DriverTripController::class, 'show']);
    Route::post('/driver/trips/{id}/update', [DriverTripController::class, 'update']);

    // Notifications
    Route::get('/driver/notifications', [DriverNotificationController::class, 'index']);
    Route::post('/driver/notifications/{id}/read', [DriverNotificationController::class, 'markAsRead']);

    // Maintenance
    Route::get('/driver/maintenance', [DriverMaintenanceController::class, 'index']);
    Route::get('/driver/maintenance/{id}', [DriverMaintenanceController::class, 'show']);
});

