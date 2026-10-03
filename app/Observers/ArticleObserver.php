<?php

namespace App\Observers;

use App\Jobs\PingIndexNow;
use App\Models\Article;
use App\Support\Seo\Seo;
use App\Support\Seo\SeoCache;

class ArticleObserver
{
    /**
     * Changes visitors can see; a view or share count alone does not count.
     */
    private const array VisibleAttributes = [
        'title', 'slug', 'lead_paragraph', 'content', 'cover_photo', 'description', 'status', 'published_date',
    ];

    /**
     * Refresh the crawl files and announce the change when a published article appears, changes or leaves.
     */
    public function saved(Article $article): void
    {
        if (! $article->wasRecentlyCreated && ! $article->wasChanged(self::VisibleAttributes)) {
            return;
        }

        SeoCache::flush();

        // A status change also covers an article leaving the site: engines then see its 410.
        if ($article->isPublished() || $article->wasChanged('status')) {
            PingIndexNow::dispatchIfEnabled([Seo::homeUrl(), route('articles.show', $article->slug)]);
        }
    }

    public function deleted(Article $article): void
    {
        SeoCache::flush();
    }

    public function restored(Article $article): void
    {
        SeoCache::flush();
    }
}
