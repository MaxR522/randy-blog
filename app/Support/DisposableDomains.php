<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

/**
 * Blocklist of temporary email domains (PUB-SUB-2), from the CC0 list
 * `disposable-email-domains/disposable-email-domains`. The copy refreshed weekly by
 * `subscriptions:update-disposable-domains` wins over the snapshot committed with the code.
 */
class DisposableDomains
{
    public const string SourceUrl = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';

    /**
     * A download with fewer lines is treated as broken and not saved.
     */
    public const int MinimumCount = 1000;

    public static function snapshotPath(): string
    {
        return resource_path('data/disposable-domains.txt');
    }

    public static function refreshedPath(): string
    {
        return storage_path('app/disposable-domains.txt');
    }

    /**
     * Whether the address's domain, or any domain it belongs to (`x.mailinator.com`), is on the list.
     */
    public function isDisposable(string $email): bool
    {
        $domain = mb_strtolower(rtrim(str($email)->afterLast('@')->toString(), '.'));

        if ($domain === '') {
            return false;
        }

        $domains = $this->domains();
        $labels = explode('.', $domain);

        while (count($labels) >= 2) {
            if (isset($domains[implode('.', $labels)])) {
                return true;
            }

            array_shift($labels);
        }

        return false;
    }

    /**
     * Parse a list file: one domain per line, `#` comments and blank lines ignored.
     *
     * @return array<int, string>
     */
    public static function parse(string $contents): array
    {
        return collect(preg_split('/\R/', $contents) ?: [])
            ->map(fn (string $line): string => mb_strtolower(trim($line)))
            ->reject(fn (string $line): bool => $line === '' || str_starts_with($line, '#'))
            ->values()
            ->all();
    }

    /**
     * Read on each call rather than kept in memory: subscriptions are rare, and Octane workers
     * then always see the latest refresh.
     *
     * @return array<string, int>
     */
    private function domains(): array
    {
        $path = File::exists(self::refreshedPath()) ? self::refreshedPath() : self::snapshotPath();

        return array_flip(self::parse(File::get($path)));
    }
}
