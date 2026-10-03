<?php

namespace App\Console\Commands;

use App\Jobs\PingIndexNow;
use App\Models\Article;
use App\Support\Seo\Seo;
use App\Support\Seo\SeoCache;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('seo:ping-scheduled-articles {--minutes=15 : Window, same as the schedule interval}')]
#[Description('Announce to IndexNow the scheduled articles that went live in the last minutes, and refresh the crawl files')]
class PingScheduledArticles extends Command
{
    /**
     * Scheduled articles go live without being saved, so no observer sees them: this command catches them.
     */
    public function handle(): int
    {
        $slugs = Article::query()
            ->published()
            ->where('published_date', '>', now()->subMinutes((int) $this->option('minutes')))
            ->pluck('slug');

        if ($slugs->isEmpty()) {
            return self::SUCCESS;
        }

        SeoCache::flush();
        PingIndexNow::dispatchIfEnabled([
            Seo::homeUrl(),
            ...$slugs->map(fn (string $slug): string => route('articles.show', $slug))->values()->all(),
        ]);

        $this->info("{$slugs->count()} article(s) announced.");

        return self::SUCCESS;
    }
}
