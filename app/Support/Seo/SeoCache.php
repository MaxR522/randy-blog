<?php

namespace App\Support\Seo;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Cache of the generated crawl files (sitemap, feed, llms.txt), cleared whenever an article changes (SEO-MAP-2).
 *
 * The short lifetime also picks up scheduled articles, which go live without any save.
 */
class SeoCache
{
    public const string Sitemap = 'seo.sitemap';

    public const string Feed = 'seo.feed';

    public const string Llms = 'seo.llms';

    public const string LlmsFull = 'seo.llms-full';

    private const int Minutes = 15;

    /**
     * @param  Closure(): string  $build
     */
    public static function remember(string $key, Closure $build): string
    {
        return Cache::remember($key, now()->addMinutes(self::Minutes), $build);
    }

    public static function flush(): void
    {
        foreach ([self::Sitemap, self::Feed, self::Llms, self::LlmsFull] as $key) {
            Cache::forget($key);
        }
    }
}
