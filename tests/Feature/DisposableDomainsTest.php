<?php

use App\Support\DisposableDomains;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

/**
 * The command writes the refreshed list into storage: keep whatever a developer has there.
 */
beforeEach(function () {
    $this->previousList = File::exists(DisposableDomains::refreshedPath()) ? File::get(DisposableDomains::refreshedPath()) : null;
    File::delete(DisposableDomains::refreshedPath());
    Http::preventStrayRequests();
});

afterEach(function () {
    $this->previousList === null
        ? File::delete(DisposableDomains::refreshedPath())
        : File::put(DisposableDomains::refreshedPath(), $this->previousList);
});

function blocklist(int $count, string $extra = ''): string
{
    return "# comment\n".collect(range(1, $count))->map(fn (int $index): string => "jetable{$index}.example")->implode("\n")."\n{$extra}\n";
}

test('the weekly refresh replaces the list, and the new list is the one checked', function () {
    Http::fake([DisposableDomains::SourceUrl => Http::response(blocklist(1000, 'Nouveau-Jetable.example'))]);

    $this->artisan('subscriptions:update-disposable-domains')->assertSuccessful();

    $domains = app(DisposableDomains::class);
    expect($domains->isDisposable('lecteur@nouveau-jetable.example'))->toBeTrue()
        ->and($domains->isDisposable('lecteur@mailinator.com'))->toBeFalse();
});

test('a failed or suspiciously short download keeps the current list', function (Closure $response) {
    File::put(DisposableDomains::refreshedPath(), "ancien-jetable.example\n");
    Http::fake([DisposableDomains::SourceUrl => $response]);

    $this->artisan('subscriptions:update-disposable-domains')->assertFailed();

    expect(File::get(DisposableDomains::refreshedPath()))->toBe("ancien-jetable.example\n");
})->with([
    'server error' => [fn () => Http::response('', 500)],
    'too short' => [fn () => Http::response(blocklist(999))],
    'unreachable' => [fn () => Http::failedConnection()],
]);

test('without a refreshed copy, the snapshot committed with the code is checked', function () {
    $domains = app(DisposableDomains::class);

    expect($domains->isDisposable('lecteur@yopmail.com'))->toBeTrue()
        ->and($domains->isDisposable('lecteur@gmail.com'))->toBeFalse();
});
