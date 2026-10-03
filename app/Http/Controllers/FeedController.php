<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Support\ArticleHtml;
use App\Support\Seo\SeoCache;
use App\Support\Seo\ShareImage;
use App\Support\Seo\StructuredData;
use Illuminate\Http\Response;

class FeedController extends Controller
{
    /**
     * Number of articles in the feed.
     */
    private const int Size = 20;

    /**
     * RSS 2.0 feed of the latest articles with their full text, for feed readers, aggregators and AI crawlers.
     */
    public function __invoke(): Response
    {
        $xml = SeoCache::remember(SeoCache::Feed, function (): string {
            $articles = Article::query()
                ->published()
                ->with(['categories', 'author'])
                ->latest('published_date')
                ->limit(self::Size)
                ->get();

            return '<?xml version="1.0" encoding="UTF-8"?>'."\n".view('seo.feed', [
                'articles' => $articles,
                'image' => fn (Article $article): ?string => $article->cover_photo ? ShareImage::large($article->cover_photo) : null,
                'html' => fn (?string $html): string => ArticleHtml::sanitize($html),
                'authorName' => StructuredData::authorName(),
            ])->render();
        });

        return response($xml, 200, ['Content-Type' => 'application/rss+xml; charset=UTF-8']);
    }
}
