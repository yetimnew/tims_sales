<?php

use App\Http\Controllers\HelpController;
use Illuminate\Support\Facades\Route;

Route::prefix('help')->name('help.')->group(function () {
    Route::get('/', [HelpController::class, 'index'])->name('index');
    Route::get('/{category}', [HelpController::class, 'category'])->name('category');
    Route::get('/{category}/{slug}', [HelpController::class, 'detail'])->name('detail');
});
