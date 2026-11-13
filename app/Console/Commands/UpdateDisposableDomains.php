<?php

namespace App\Console\Commands;

use App\Support\DisposableDomains;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

#[Signature('subscriptions:update-disposable-domains')]
#[Description('Download the latest list of temporary email domains refused by the subscription form')]
class UpdateDisposableDomains extends Command
{
    /**
     * Run weekly by the scheduler (spec §7.6). A failed or suspiciously short download keeps the current list.
     */
    public function handle(): int
    {
        try {
            $response = Http::timeout(30)->get(DisposableDomains::SourceUrl);
        } catch (ConnectionException $exception) {
            $this->error('Download failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $domains = $response->successful() ? DisposableDomains::parse($response->body()) : [];

        if (count($domains) < DisposableDomains::MinimumCount) {
            $this->error("Download rejected (HTTP {$response->status()}, ".count($domains).' domains): the current list is kept.');

            return self::FAILURE;
        }

        File::ensureDirectoryExists(dirname(DisposableDomains::refreshedPath()));
        File::put(DisposableDomains::refreshedPath(), implode("\n", $domains)."\n");

        $this->info(count($domains).' disposable domains saved.');

        return self::SUCCESS;
    }
}
