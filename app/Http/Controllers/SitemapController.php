<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Support\Seo\Seo;
use App\Support\Seo\SeoCache;
use App\Support\Seo\ShareImage;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * `sitemap.xml`: home, author page, privacy policy and every published article, with its real last change (SEO-MAP-1).
     * No `changefreq` or `priority`: Google ignores them.
     */
    public function __invoke(): Response
    {
        $xml = SeoCache::remember(SeoCache::Sitemap, function (): string {
            $articles = Article::query()
                ->published()
                ->latest('published_date')
                ->get(['id', 'slug', 'cover_photo', 'published_date', 'updated_at']);
            $author = Seo::author();
            $lastChange = $articles->max(fn (Article $article) => $article->updated_at ?? $article->published_date);

            $pages = [
                ['loc' => Seo::homeUrl(), 'lastmod' => $lastChange?->toIso8601String(), 'image' => null],
                ...($author ? [['loc' => route('profile.show', $author->slug), 'lastmod' => $author->updated_at?->toIso8601String(), 'image' => null]] : []),
                ['loc' => route('privacy'), 'lastmod' => null, 'image' => null],
                ...$articles->map(fn (Article $article): array => [
                    'loc' => route('articles.show', $article->slug),
                    'lastmod' => ($article->updated_at ?? $article->published_date)?->toIso8601String(),
                    'image' => $article->cover_photo ? ShareImage::large($article->cover_photo) : null,
                ])->all(),
            ];

            return '<?xml version="1.0" encoding="UTF-8"?>'."\n".view('seo.sitemap', ['pages' => $pages])->render();
        });

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
