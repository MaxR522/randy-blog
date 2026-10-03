<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;

/**
 * Tells IndexNow search engines (Bing, which also feeds ChatGPT search and Copilot, Yandex, Seznam, Naver) that pages changed (SEO-MAP-4).
 */
class PingIndexNow implements ShouldQueue
{
    use Queueable;

    private const string Endpoint = 'https://api.indexnow.org/indexnow';

    public int $tries = 3;

    public int $backoff = 60;

    /**
     * @param  list<string>  $urls
     */
    public function __construct(public array $urls) {}

    /**
     * Only production pings, and only once a key is configured: other environments must not announce their URLs.
     */
    public static function isEnabled(): bool
    {
        return app()->isProduction() && filled(config('services.indexnow.key'));
    }

    /**
     * @param  list<string>  $urls
     */
    public static function dispatchIfEnabled(array $urls): void
    {
        if (self::isEnabled() && $urls !== []) {
            self::dispatch($urls);
        }
    }

    public function handle(): void
    {
        if (! self::isEnabled()) {
            return;
        }

        $key = config()->string('services.indexnow.key');

        Http::timeout(10)
            ->post(self::Endpoint, [
                'host' => parse_url(url('/'), PHP_URL_HOST),
                'key' => $key,
                'keyLocation' => route('indexnow.key', $key),
                'urlList' => array_values(array_unique($this->urls)),
            ])
            ->throw();
    }
}
