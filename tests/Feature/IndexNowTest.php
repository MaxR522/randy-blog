<?php

use App\Jobs\PingIndexNow;
use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

test('SEO-MAP-4 publishing an article in production announces it to IndexNow', function () {
    $this->app['env'] = 'production';
    config(['services.indexnow.key' => 'cle-indexnow-1234']);
    $article = Article::factory()->create();
    Queue::fake([PingIndexNow::class]);

    $article->update(['status' => 'PUBLISHED', 'published_date' => now()->subMinute()]);

    Queue::assertPushed(PingIndexNow::class, fn (PingIndexNow $job) => $job->urls === [url('/').'/', route('articles.show', $article->slug)]);
});

test('SEO-MAP-4 saving a draft announces nothing', function () {
    $this->app['env'] = 'production';
    config(['services.indexnow.key' => 'cle-indexnow-1234']);
    $article = Article::factory()->create();
    Queue::fake([PingIndexNow::class]);

    $article->update(['title' => 'Nouveau titre']);

    Queue::assertNotPushed(PingIndexNow::class);
});

test('SEO-MAP-4 nothing is announced outside production', function () {
    config(['services.indexnow.key' => 'cle-indexnow-1234']);
    Queue::fake([PingIndexNow::class]);

    Article::factory()->published()->create();

    Queue::assertNotPushed(PingIndexNow::class);
});

test('SEO-MAP-4 the job posts the URLs with the key and its location', function () {
    $this->app['env'] = 'production';
    config(['services.indexnow.key' => 'cle-indexnow-1234']);
    Http::fake(['https://api.indexnow.org/indexnow' => Http::response(status: 202)]);

    (new PingIndexNow(['https://randy-donny.com/articles/un-article']))->handle();

    Http::assertSent(fn ($request) => $request['key'] === 'cle-indexnow-1234'
        && $request['keyLocation'] === route('indexnow.key', 'cle-indexnow-1234')
        && $request['urlList'] === ['https://randy-donny.com/articles/un-article']);
});

test('SEO-MAP-4 scheduled articles that just went live are announced', function () {
    $this->app['env'] = 'production';
    config(['services.indexnow.key' => 'cle-indexnow-1234']);
    // Creating published articles in production already queues pings: a fake swallows them, a fresh one records only the command's.
    Queue::fake([PingIndexNow::class]);
    $justLive = Article::factory()->published(now()->subMinutes(5))->create();
    Article::factory()->published(now()->subHour())->create();
    Queue::fake([PingIndexNow::class]);

    $this->artisan('seo:ping-scheduled-articles')->assertSuccessful();

    Queue::assertPushed(PingIndexNow::class, fn (PingIndexNow $job) => $job->urls === [url('/').'/', route('articles.show', $justLive->slug)]);
});

test('SEO-MAP-4 the key file serves the configured key only', function () {
    config(['services.indexnow.key' => 'cle-indexnow-1234']);

    $this->get('/cle-indexnow-1234.txt')->assertOk()->assertContent('cle-indexnow-1234');
    $this->get('/autre-cle-5678.txt')->assertNotFound();
});
