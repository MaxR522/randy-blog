<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\ArticleMarkdownController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LlmsController;
use App\Http\Controllers\LlmsFullController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SitemapController;
use App\Support\Seo\Seo;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

/*
 * Markdown copy of an article for AI assistants; declared first so `.md` never reaches the article route.
 */
Route::get('/articles/{article:slug}.md', ArticleMarkdownController::class)->name('articles.markdown');

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

Route::inertia('/politique-de-confidentialite', 'privacy', [
    'seo' => fn (): array => Seo::privacy()->toArray(),
])->name('privacy');

/*
 * Files for crawlers (SEO-CRAWL-2, SEO-MAP-1) and AI assistants.
 */
Route::get('/robots.txt', RobotsController::class)->name('robots');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/feed.xml', FeedController::class)->name('feed');
Route::get('/llms.txt', LlmsController::class)->name('llms');
Route::get('/llms-full.txt', LlmsFullController::class)->name('llms-full');

/*
 * IndexNow proves the site owns its key by serving it at `/{key}.txt` (SEO-MAP-4).
 */
Route::get('/{key}.txt', function (string $key) {
    abort_unless(filled(config('services.indexnow.key')) && hash_equals(config()->string('services.indexnow.key'), $key), 404);

    return response($key, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
})->where('key', '[A-Za-z0-9-]{8,128}')->name('indexnow.key');
