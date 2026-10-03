<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

/*
 * Same URL as V1: article links are already indexed.
 */
Route::get('/articles/{article:slug}', ArticleController::class)->name('articles.show');

Route::get('/recherche', SearchController::class)->name('search');

/*
 * Public pages linked from the home page and not built yet: they answer 404 until their own task.
 */
Route::get('/profil/{slug}', fn () => abort(404))->name('profile.show');
Route::get('/politique-de-confidentialite', fn () => abort(404))->name('privacy');
