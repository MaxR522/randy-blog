<?php

use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\MediaController;
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

    Route::resource('articles', ArticleController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('/articles/nouveau', [ArticleController::class, 'create'])->name('articles.create');
    Route::get('/articles/{article}/modifier', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::patch('/articles/{article}/publier', [ArticleController::class, 'publish'])->name('articles.publish');
    Route::patch('/articles/{article}/archiver', [ArticleController::class, 'archive'])->name('articles.archive');
    Route::get('/articles/{article}/apercu', [ArticleController::class, 'preview'])->name('articles.preview');
    Route::post('/medias', [MediaController::class, 'store'])->middleware('throttle:60,1')->name('media.store');
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::inertia('/abonnements', 'admin/placeholder', ['title' => 'Abonnements'])->name('subscriptions.index');

    Route::get('/compte', [AccountController::class, 'profile'])->name('account');
    Route::inertia('/compte/securite', 'admin/placeholder', ['title' => 'Sécurité'])->name('account.security');
    Route::post('/compte/avatar', [AccountController::class, 'updateAvatar'])->middleware('throttle:20,1')->name('account.avatar');
    Route::patch('/compte/nom-affichage', [AccountController::class, 'updateDisplayName'])->name('account.display-name');
    Route::patch('/compte/biographie', [AccountController::class, 'updateBiography'])->name('account.biography');
    Route::post('/compte/email', [AccountController::class, 'requestEmailChange'])->middleware('throttle:6,1')->name('account.email');
});

/*
 * The link sent to a new login address (ADM-ACC-4) answers without a session: it may be opened on another device.
 * The controller checks the signature itself, so that a bad link gets the 404 rather than a 403.
 */
Route::get('/admin/compte/email/confirmer/{user}', [AccountController::class, 'confirmEmailChange'])
    ->middleware('throttle:10,1')
    ->name('admin.account.email.confirm');

Route::post('/admin/deconnexion', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware(EnsureAdminIsAuthenticated::class)
    ->name('logout');
