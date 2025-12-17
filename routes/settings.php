<?php

use App\Http\Controllers\Settings\DriverGradingSettingsController;
use App\Http\Controllers\Settings\DriverTruckGradingSettingsController;
use App\Http\Controllers\Settings\NotificationPreferenceController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SystemBackupController;
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

    Route::get('settings/driver-truck-grading', [DriverTruckGradingSettingsController::class, 'edit'])
        ->name('settings.driver-truck-grading.edit');

    Route::patch('settings/driver-truck-grading/weights', [DriverTruckGradingSettingsController::class, 'updateWeights'])
        ->name('settings.driver-truck-grading.weights.update');

    Route::patch('settings/driver-truck-grading/grade-thresholds', [DriverTruckGradingSettingsController::class, 'updateGradeThresholds'])
        ->name('settings.driver-truck-grading.grade-thresholds.update');

    // Driver grading settings
    Route::get('settings/driver-grading', [DriverGradingSettingsController::class, 'edit'])
        ->name('settings.driver-grading.edit');

    Route::post('settings/driver-grading/recalculate', [DriverGradingSettingsController::class, 'recalculate'])
        ->name('settings.driver-grading.recalculate');

    Route::patch('settings/driver-grading', [DriverGradingSettingsController::class, 'update'])
        ->name('settings.driver-grading.update');

    Route::get('settings/backups', [SystemBackupController::class, 'index'])
        ->middleware('can:system.backup')
        ->name('settings.backups.index');

    Route::post('settings/backups/run', [SystemBackupController::class, 'run'])
        ->middleware('can:system.backup')
        ->name('settings.backups.run');

    Route::post('settings/backups/restore/upload', [SystemBackupController::class, 'restoreUpload'])
        ->middleware('can:system.backup')
        ->name('settings.backups.restore.upload');

    Route::post('settings/backups/restore', [SystemBackupController::class, 'restoreExisting'])
        ->middleware('can:system.backup')
        ->name('settings.backups.restore');

    Route::get('settings/backups/download', [SystemBackupController::class, 'download'])
        ->middleware('can:system.backup')
        ->name('settings.backups.download');

    Route::delete('settings/backups', [SystemBackupController::class, 'destroy'])
        ->middleware('can:system.backup')
        ->name('settings.backups.destroy');
});
