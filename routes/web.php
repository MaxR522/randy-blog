<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

/*
 * Same URL as V1: article links are already indexed.
 */
Route::get('/articles/{article:slug}', ArticleController::class)->name('articles.show');

Route::get('/recherche', SearchController::class)->name('search');

Route::get('/profil/{user:slug}', ProfileController::class)->name('profile.show');

/*
 * V1 profile URL, permanently moved (SEO-CRAWL-5).
 */
Route::get('/profile/{slug}', fn (string $slug) => redirect()->route('profile.show', $slug, 301));

Route::inertia('/politique-de-confidentialite', 'privacy')->name('privacy');
