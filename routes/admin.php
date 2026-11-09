<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Middleware\EnsureAdminIsAuthenticated;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;

/*
 * Authentication, on Fortify's controllers and route names, with French URLs.
 */
Route::prefix('admin')->middleware('guest')->group(function () {
    Route::get('/connexion', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/connexion', [AuthenticatedSessionController::class, 'store'])->name('login.store');

    Route::get('/mot-de-passe-oublie', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/mot-de-passe-oublie', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:admin-password-reset')
        ->name('password.email');

    Route::get('/reinitialisation/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reinitialisation', [NewPasswordController::class, 'store'])
        ->middleware('throttle:admin-password-reset')
        ->name('password.update');
});

/*
 * The panel itself. `auth.session` logs out other sessions when the password changes.
 */
Route::prefix('admin')->name('admin.')->middleware([EnsureAdminIsAuthenticated::class, 'auth.session'])->group(function () {
    Route::redirect('/', '/admin/articles')->name('index');

    Route::inertia('/articles', 'admin/placeholder', ['title' => 'Articles'])->name('articles.index');
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::inertia('/abonnements', 'admin/placeholder', ['title' => 'Abonnements'])->name('subscriptions.index');
    Route::inertia('/compte', 'admin/placeholder', ['title' => 'Compte'])->name('account');
});

Route::post('/admin/deconnexion', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware(EnsureAdminIsAuthenticated::class)
    ->name('logout');
