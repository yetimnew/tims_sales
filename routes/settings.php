<?php

use App\Http\Controllers\Settings\DriverGradingSettingsController;
use App\Http\Controllers\Settings\NotificationPreferenceController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TruckGradingSettingsController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/notifications', [NotificationPreferenceController::class, 'edit'])
        ->name('notification-preferences.edit');

    Route::patch('settings/notifications', [NotificationPreferenceController::class, 'update'])
        ->name('notification-preferences.update');

    Route::get('settings/truck-grading', [TruckGradingSettingsController::class, 'edit'])
        ->name('settings.truck-grading.edit');

    Route::post('settings/truck-grading/recalculate', [TruckGradingSettingsController::class, 'recalculate'])
        ->name('settings.truck-grading.recalculate');

    Route::patch('settings/truck-grading', [TruckGradingSettingsController::class, 'update'])
        ->name('settings.truck-grading.update');

    Route::patch('settings/truck-grading/weights', [TruckGradingSettingsController::class, 'updateWeights'])
        ->name('settings.truck-grading.weights.update');

    Route::patch('settings/truck-grading/grade-thresholds', [TruckGradingSettingsController::class, 'updateGradeThresholds'])
        ->name('settings.truck-grading.grade-thresholds.update');

    // Driver grading settings
    Route::get('settings/driver-grading', [DriverGradingSettingsController::class, 'edit'])
        ->name('settings.driver-grading.edit');

    Route::post('settings/driver-grading/recalculate', [DriverGradingSettingsController::class, 'recalculate'])
        ->name('settings.driver-grading.recalculate');
});
