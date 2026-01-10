<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverLocationController;
use App\Http\Controllers\Api\DriverMaintenanceController;
use App\Http\Controllers\Api\DriverNotificationController;
use App\Http\Controllers\Api\DriverPerformanceController;
use App\Http\Controllers\Api\DriverStatusController;
use App\Http\Controllers\Api\DriverTripController;
use App\Http\Controllers\Api\StorageController;
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

// Public routes - Authentication
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Public routes - Storage (for images with CORS)
Route::get('/storage/{path}', [StorageController::class, 'serve'])
    ->where('path', '.*')
    ->name('storage.serve');

// Protected routes - require authentication
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Authentication & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/picture', [AuthController::class, 'updateProfilePicture']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Driver profile
    Route::get('/driver/profile', [DriverController::class, 'profile']);

    // Performance
    Route::get('/driver/performance', [DriverPerformanceController::class, 'index']);
    Route::get('/driver/performance/history', [DriverPerformanceController::class, 'history']);

    // Status management
    Route::get('/driver/status/current', [DriverStatusController::class, 'current']);
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
    Route::post('/driver/notifications/read-all', [DriverNotificationController::class, 'markAllAsRead']);

    // Maintenance
    Route::get('/driver/maintenance', [DriverMaintenanceController::class, 'index']);
    Route::get('/driver/maintenance/{id}', [DriverMaintenanceController::class, 'show']);
});

