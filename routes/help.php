<?php

use App\Http\Controllers\HelpController;
use Illuminate\Support\Facades\Route;

Route::prefix('help')->name('help.')->group(function () {
    // Main help pages
    Route::get('/', [HelpController::class, 'index'])->name('index');
    Route::get('/search', [HelpController::class, 'search'])->name('search');
    Route::get('/faq', [HelpController::class, 'faq'])->name('faq');
    Route::get('/contact', [HelpController::class, 'contact'])->name('contact');
    Route::post('/contact', [HelpController::class, 'submitContact'])->name('contact.submit');
    
    // Category and article pages
    Route::get('/{category}', [HelpController::class, 'category'])->name('category');
    Route::get('/{category}/{subcategory}/{slug?}', [HelpController::class, 'article'])->name('article');
});
