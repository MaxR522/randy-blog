<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

/*
 * Public pages linked from the home page and not built yet: they answer 404 until their own task.
 */
Route::get('/articles/{slug}', fn () => abort(404))->name('articles.show');
Route::get('/profil/{slug}', fn () => abort(404))->name('profile.show');
Route::get('/recherche', fn () => abort(404))->name('search');
Route::get('/politique-de-confidentialite', fn () => abort(404))->name('privacy');
