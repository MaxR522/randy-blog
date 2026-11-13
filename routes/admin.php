<?php

use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\AccountSecurityController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\NewsletterController;
use App\Http\Controllers\Admin\SubscriptionController;
use App\Http\Middleware\EnsureAdminIsAuthenticated;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;

/*
 * Authentication, on Fortify's controllers and route names, with French URLs.
 */
Route::prefix('admin')->middleware('guest')->group(function () {
    Route::get('/connexion', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/connexion', [AuthenticatedSessionController::class, 'store'])->name('login.store');

    Route::get('/deux-facteurs', [TwoFactorAuthenticatedSessionController::class, 'create'])->name('two-factor.login');
    Route::post('/deux-facteurs', [TwoFactorAuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:admin-two-factor')
        ->name('two-factor.login.store');

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
    Route::post('/articles/import-word', [ArticleController::class, 'importWord'])->middleware('throttle:30,1')->name('articles.import-word');
    Route::post('/articles/suggestions', [ArticleController::class, 'suggest'])->middleware('throttle:10,1')->name('articles.suggestions');
    Route::get('/articles/{article}/modifier', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::patch('/articles/{article}/publier', [ArticleController::class, 'publish'])->name('articles.publish');
    Route::patch('/articles/{article}/archiver', [ArticleController::class, 'archive'])->name('articles.archive');
    Route::get('/articles/{article}/apercu', [ArticleController::class, 'preview'])->name('articles.preview');
    Route::post('/medias', [MediaController::class, 'store'])->middleware('throttle:60,1')->name('media.store');
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('/abonnements', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::delete('/abonnements/{subscription}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
    Route::get('/abonnements/newsletters', [NewsletterController::class, 'index'])->name('newsletters.index');
    Route::get('/newsletters/nouvelle', [NewsletterController::class, 'create'])->name('newsletters.create');
    Route::post('/newsletters', [NewsletterController::class, 'store'])->name('newsletters.store');
    Route::post('/newsletters/apercu', [NewsletterController::class, 'preview'])->middleware('throttle:60,1')->name('newsletters.preview');
    Route::post('/newsletters/test', [NewsletterController::class, 'test'])->middleware('throttle:6,1')->name('newsletters.test');
    Route::post('/newsletters/envoyer', [NewsletterController::class, 'send'])->middleware('throttle:6,1')->name('newsletters.send');
    Route::get('/newsletters/articles', [NewsletterController::class, 'articles'])->name('newsletters.articles');
    Route::get('/newsletters/abonnes', [NewsletterController::class, 'subscribers'])->name('newsletters.subscribers');
    Route::get('/newsletters/{newsletter}', [NewsletterController::class, 'show'])->whereNumber('newsletter')->name('newsletters.show');
    Route::put('/newsletters/{newsletter}', [NewsletterController::class, 'update'])->whereNumber('newsletter')->name('newsletters.update');
    Route::post('/newsletters/{newsletter}/envoyer', [NewsletterController::class, 'send'])->whereNumber('newsletter')->middleware('throttle:6,1')->name('newsletters.send-draft');
    Route::post('/newsletters/{newsletter}/dupliquer', [NewsletterController::class, 'duplicate'])->whereNumber('newsletter')->name('newsletters.duplicate');

    Route::get('/compte', [AccountController::class, 'profile'])->name('account');
    Route::post('/compte/avatar', [AccountController::class, 'updateAvatar'])->middleware('throttle:20,1')->name('account.avatar');
    Route::patch('/compte/nom-affichage', [AccountController::class, 'updateDisplayName'])->name('account.display-name');
    Route::patch('/compte/biographie', [AccountController::class, 'updateBiography'])->name('account.biography');
    Route::post('/compte/email', [AccountController::class, 'requestEmailChange'])->middleware('throttle:6,1')->name('account.email');

    Route::get('/compte/securite', [AccountSecurityController::class, 'show'])->name('account.security');
    Route::put('/compte/mot-de-passe', [AccountSecurityController::class, 'updatePassword'])->middleware('throttle:6,1')->name('account.password');
    Route::put('/compte/email-recuperation', [AccountSecurityController::class, 'updateRecoveryEmail'])->middleware('throttle:6,1')->name('account.recovery-email');
    Route::delete('/compte/email-recuperation', [AccountSecurityController::class, 'destroyRecoveryEmail'])->middleware('throttle:6,1')->name('account.recovery-email.destroy');
    Route::put('/compte/telephone-recuperation', [AccountSecurityController::class, 'updateRecoveryPhone'])->name('account.recovery-phone');
    Route::post('/compte/2fa', [AccountSecurityController::class, 'enableTwoFactor'])->middleware('throttle:6,1')->name('account.two-factor.enable');
    Route::put('/compte/2fa', [AccountSecurityController::class, 'confirmTwoFactor'])->middleware('throttle:6,1')->name('account.two-factor.confirm');
    Route::delete('/compte/2fa/activation', [AccountSecurityController::class, 'cancelTwoFactor'])->name('account.two-factor.cancel');
    Route::post('/compte/2fa/codes', [AccountSecurityController::class, 'regenerateRecoveryCodes'])->middleware('throttle:6,1')->name('account.two-factor.recovery-codes');
    Route::delete('/compte/2fa', [AccountSecurityController::class, 'disableTwoFactor'])->middleware('throttle:6,1')->name('account.two-factor.disable');
    Route::delete('/compte/appareils', [AccountSecurityController::class, 'destroyOtherSessions'])->name('account.devices.destroy-others');
    Route::delete('/compte/appareils/{device}', [AccountSecurityController::class, 'destroySession'])->name('account.devices.destroy');
});

/*
 * The link sent to a new login address (ADM-ACC-4) answers without a session: it may be opened on another device.
 * The controller checks the signature itself, so that a bad link gets the 404 rather than a 403.
 */
Route::get('/admin/compte/email/confirmer/{user}', [AccountController::class, 'confirmEmailChange'])
    ->middleware('throttle:10,1')
    ->name('admin.account.email.confirm');

/*
 * The verification link of a recovery email (ADM-SEC-1), on the same terms.
 */
Route::get('/admin/compte/email-recuperation/confirmer/{user}', [AccountSecurityController::class, 'confirmRecoveryEmail'])
    ->middleware('throttle:10,1')
    ->name('admin.account.recovery-email.confirm');

Route::post('/admin/deconnexion', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware(EnsureAdminIsAuthenticated::class)
    ->name('logout');
