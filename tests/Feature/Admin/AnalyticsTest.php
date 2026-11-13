<?php

use App\Models\Article;
use App\Models\ArticleSlugRedirect;
use App\Models\Newsletter;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

const GoogleTokenUrl = 'oauth2.googleapis.com/token';

const GoogleReportUrl = 'analyticsdata.googleapis.com/v1beta/properties/*';

beforeEach(function () {
    Cache::flush();

    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $pem);

    config([
        'services.google_analytics.property_id' => '123456',
        'services.google_analytics.credentials_json' => json_encode([
            'client_email' => 'blog@projet.iam.gserviceaccount.com',
            'private_key' => $pem,
        ]),
    ]);
});

/**
 * @param  list<array{0: list<string>, 1: list<int|string>}>  $rows  Dimension values and metric values.
 * @return array<string, mixed>
 */
function gaReport(array $rows): array
{
    return ['rows' => array_map(fn (array $row): array => [
        'dimensionValues' => array_map(fn (string $value): array => ['value' => $value], $row[0]),
        'metricValues' => array_map(fn (int|string $value): array => ['value' => (string) $value], $row[1]),
    ], $rows)];
}

/**
 * Answers each GA4 report according to its first dimension.
 *
 * @param  array<string, array<string, mixed>>  $reports  Keyed by dimension name, `totals` for no dimension.
 */
function fakeGoogle(array $reports = []): void
{
    $reports += [
        'totals' => gaReport([
            [['current'], [200, 300, 1000, 12000]],
            [['previous'], [100, 300, 1250, 6000]],
        ]),
        'date' => gaReport([]),
        'pagePath' => gaReport([]),
        'sessionDefaultChannelGroup' => gaReport([]),
        'deviceCategory' => gaReport([]),
        'countryId' => gaReport([]),
    ];

    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton', 'expires_in' => 3600]),
        GoogleReportUrl => fn (Request $request) => Http::response(
            $reports[$request['dimensions'][0]['name'] ?? 'totals'],
        ),
    ]);
}

/**
 * Opens the page and loads the deferred GA4 props, like the browser does.
 */
function analyticsPage(mixed $test, string $query = ''): Assert|array
{
    $props = [];

    $test->actingAs(User::factory()->create())
        ->get('/admin'.$query)
        ->assertOk()
        ->assertInertia(function (Assert $page) use (&$props) {
            $props = $page->toArray()['props'];

            $page->loadDeferredProps(function (Assert $loaded) use (&$props) {
                $props = [...$props, ...$loaded->toArray()['props']];
            });
        });

    return $props;
}

test('ADM-COM-8 guests get a 404 on the analytics page', function () {
    Http::fake();

    $this->get('/admin')->assertNotFound();

    Http::assertNothingSent();
});

test('ADM-ANA-1 the period defaults to 28 days and an unknown value falls back to it', function (string $query, int $days) {
    fakeGoogle();

    expect(analyticsPage($this, $query)['period'])->toBe($days);
})->with([
    'default' => ['', 28],
    '7' => ['?periode=7', 7],
    '90' => ['?periode=90', 90],
    'unknown' => ['?periode=15', 28],
    'not a number' => ['?periode=abc', 28],
]);

test('ADM-ANA-1 the report compares the period with the one before', function () {
    fakeGoogle();

    $kpis = analyticsPage($this, '?periode=7')['analytics']['kpis'];

    expect($kpis['users'])->toBe(['value' => 200, 'change' => 100])
        ->and($kpis['sessions'])->toBe(['value' => 300, 'change' => 0])
        ->and($kpis['pageViews'])->toBe(['value' => 1000, 'change' => -20])
        ->and($kpis['engagementSeconds'])->toBe(['value' => 60, 'change' => 0]);

    Http::assertSent(fn (Request $request) => str_contains($request->url(), ':runReport')
        && isset($request['dateRanges'][1])
        && $request['dateRanges'][0]['startDate'] === '7daysAgo'
        && $request['dateRanges'][1]['startDate'] === '14daysAgo'
        && $request['dateRanges'][1]['endDate'] === '8daysAgo');
});

test('ADM-ANA-1 there is no percentage when the previous period had no data', function () {
    fakeGoogle(['totals' => gaReport([[['current'], [10, 12, 30, 600]]])]);

    $kpis = analyticsPage($this)['analytics']['kpis'];

    expect($kpis['users'])->toBe(['value' => 10, 'change' => null]);
});

test('ADM-ANA-3 page views per day cover every day of the period', function () {
    fakeGoogle(['date' => gaReport([[[now()->subDays(2)->format('Ymd')], [42]]])]);

    $daily = analyticsPage($this, '?periode=7')['analytics']['daily'];

    expect($daily)->toHaveCount(7)
        ->and(collect($daily)->sum('views'))->toBe(42)
        ->and(collect($daily)->firstWhere('views', 42)['date'])->toBe(now()->subDays(2)->toDateString());
});

test('ADM-ANA-3 the top articles match the slug, an old slug and the markdown copy, and drop the rest', function () {
    $madagascar = Article::factory()->published()->create(['slug' => 'madagascar', 'title' => 'Madagascar au quotidien']);
    $lenteur = Article::factory()->published()->create(['slug' => 'eloge-de-la-lenteur', 'title' => 'Éloge de la lenteur']);
    ArticleSlugRedirect::create(['article_id' => $lenteur->id, 'old_slug' => 'lenteur']);

    fakeGoogle(['pagePath' => gaReport([
        [['/articles/lenteur'], [400]],
        [['/articles/madagascar'], [300]],
        [['/articles/eloge-de-la-lenteur'], [200]],
        [['/articles/madagascar.md'], [50]],
        [['/articles/supprime'], [999]],
        [['/articles/madagascar/commentaires'], [999]],
    ])]);

    expect(analyticsPage($this)['analytics']['topArticles'])->toBe([
        ['id' => $lenteur->id, 'title' => 'Éloge de la lenteur', 'views' => 600],
        ['id' => $madagascar->id, 'title' => 'Madagascar au quotidien', 'views' => 350],
    ]);
});

test('ADM-ANA-3 only the ten most viewed articles are listed', function () {
    $articles = Article::factory()->published()->count(12)->create();

    fakeGoogle(['pagePath' => gaReport($articles->map(fn (Article $article, int $index): array => [
        ['/articles/'.$article->slug], [1000 - $index],
    ])->all())]);

    $top = analyticsPage($this)['analytics']['topArticles'];

    expect($top)->toHaveCount(10)
        ->and($top[0]['id'])->toBe($articles[0]->id);
});

test('ADM-ANA-3 sources, devices and countries are shown in French with their share', function () {
    fakeGoogle([
        'sessionDefaultChannelGroup' => gaReport([[['Organic Social'], [600]], [['Organic Search'], [300]], [['Direct'], [99]], [['Unassigned'], [1]]]),
        'deviceCategory' => gaReport([[['mobile'], [75]], [['desktop'], [20]], [['tablet'], [5]]]),
        'countryId' => gaReport([[['MG'], [80]], [['FR'], [20]]]),
    ]);

    $analytics = analyticsPage($this)['analytics'];

    expect($analytics['sources'])->toBe([
        ['label' => 'Réseaux sociaux', 'share' => 60],
        ['label' => 'Recherche organique', 'share' => 30],
        ['label' => 'Direct', 'share' => 10],
    ]) // « Non attribué » rounds to 0 % and is left out.->and($analytics['devices'][1])->toBe(['label' => 'Ordinateur', 'share' => 20])
        ->and($analytics['countries'][0])->toBe(['label' => 'Madagascar', 'share' => 80]);
});

test('ADM-ANA-4 the blog figures come from the database', function () {
    Article::factory()->published()->count(2)->create();
    Article::factory()->draft()->create();
    Subscription::factory()->count(2)->create(['verified_at' => now()->subDays(40)]);
    Subscription::factory()->create(['verified_at' => now()->subDays(3)]);
    Subscription::factory()->pending()->create();
    Subscription::factory()->unsubscribed()->create();
    Newsletter::factory()->sent()->create(['subject' => 'Les chroniques d’octobre', 'recipients_count' => 371]);
    Newsletter::factory()->create(['subject' => 'Brouillon']);

    fakeGoogle();

    $this->actingAs(User::factory()->create())
        ->get('/admin')
        ->assertInertia(fn (Assert $page) => $page
            ->where('blog.publishedArticles', 2)
            ->where('blog.confirmedSubscribers', 3)
            ->where('blog.newSubscribers', 1)
            ->where('blog.lastNewsletter.subject', 'Les chroniques d’octobre')
            ->where('blog.lastNewsletter.recipients', 371));
});

test('ADM-ANA-4 there is no last newsletter before the first one is sent', function () {
    fakeGoogle();

    $this->actingAs(User::factory()->create())
        ->get('/admin')
        ->assertInertia(fn (Assert $page) => $page->where('blog.lastNewsletter', null));
});

test('ADM-ANA-5 GA4 answers are cached for an hour per period', function () {
    fakeGoogle();

    analyticsPage($this);
    $reportCalls = Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count();

    analyticsPage($this);

    expect(Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count())->toBe($reportCalls);

    analyticsPage($this, '?periode=7');

    expect(Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count())->toBeGreaterThan($reportCalls);
});

test('ADM-ANA-5 the access token is signed with the service account key and reused', function () {
    fakeGoogle();

    analyticsPage($this);
    analyticsPage($this, '?periode=7');

    // One token, then six reports for each of the two periods.
    Http::assertSentCount(1 + 6 * 2);
    Http::assertSent(function (Request $request) {
        if (! str_contains($request->url(), GoogleTokenUrl)) {
            return false;
        }

        [$header, $claims] = array_map(
            fn (string $part) => json_decode(base64_decode(strtr($part, '-_', '+/')), true),
            array_slice(explode('.', $request['assertion']), 0, 2),
        );

        return $header['alg'] === 'RS256'
            && $claims['iss'] === 'blog@projet.iam.gserviceaccount.com'
            && $claims['scope'] === 'https://www.googleapis.com/auth/analytics.readonly';
    });
});

test('ADM-ANA-5 a GA4 failure leaves the database figures and is not cached', function () {
    Article::factory()->published()->create();

    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton']),
        GoogleReportUrl => Http::response(['error' => ['message' => 'Quota']], 429),
    ]);

    $props = analyticsPage($this);

    expect($props['analytics'])->toBeNull()
        ->and($props['blog']['publishedArticles'])->toBe(1);

    // Google answers again: a fresh fake replaces the failing one.
    Http::swap(new Factory);
    fakeGoogle();

    expect(analyticsPage($this)['analytics'])->not->toBeNull();
});

test('ADM-ANA-5 GA4 not configured gives the unavailable state without calling Google', function (string $key) {
    config([$key => null]);
    Http::fake();

    expect(analyticsPage($this)['analytics'])->toBeNull();

    Http::assertNothingSent();
})->with(['services.google_analytics.property_id', 'services.google_analytics.credentials_json']);

test('ADM-ANA-5 an unreachable Google gives the unavailable state', function () {
    Http::fake(fn () => throw new ConnectionException('timeout'));

    expect(analyticsPage($this)['analytics'])->toBeNull();
});

test('ADM-ANA-5 a report Google leaves unanswered is asked again', function () {
    $failures = Http::sequence();

    foreach (range(1, 6) as $ignored) {
        $failures->push('', 503);
    }

    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton']),
        GoogleReportUrl => $failures->whenEmpty(Http::response(gaReport([]))),
    ]);

    expect(analyticsPage($this)['analytics'])->not->toBeNull();
});

test('ADM-ANA-5 reports Google answered are kept when another stays unanswered', function () {
    $pagesAnswer = new ArrayObject([503]);

    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton']),
        GoogleReportUrl => function (Request $request) use ($pagesAnswer) {
            if (($request['dimensions'][0]['name'] ?? null) === 'pagePath') {
                return Http::response(gaReport([]), $pagesAnswer[0]);
            }

            return Http::response(gaReport([]));
        },
    ]);

    expect(analyticsPage($this)['analytics'])->toBeNull();

    // Next visit: Google answers the missing report, and only that one is requested.
    $pagesAnswer[0] = 200;
    Http::swap(new Factory);
    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton']),
        GoogleReportUrl => Http::response(gaReport([])),
    ]);

    expect(analyticsPage($this)['analytics'])->not->toBeNull();

    expect(Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count())->toBe(1);
});

test('ADM-ANA-5 the refresh command fetches every period and the page then reads them from the cache', function () {
    fakeGoogle();

    $this->artisan('analytics:refresh')->assertSuccessful();

    $reportCalls = Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count();

    expect($reportCalls)->toBe(6 * 3);

    analyticsPage($this, '?periode=90');

    expect(Http::recorded(fn (Request $request) => str_contains($request->url(), ':runReport'))->count())->toBe($reportCalls);
});

test('ADM-ANA-5 a failed refresh keeps the figures already cached', function () {
    fakeGoogle(['totals' => gaReport([[['current'], [200, 300, 1000, 12000]], [['previous'], [100, 300, 1250, 6000]]])]);
    analyticsPage($this);

    Http::swap(new Factory);
    Http::fake([
        GoogleTokenUrl => Http::response(['access_token' => 'jeton']),
        GoogleReportUrl => Http::response('', 503),
    ]);

    $this->artisan('analytics:refresh')->assertFailed();

    expect(analyticsPage($this)['analytics']['kpis']['users']['value'])->toBe(200);
});
