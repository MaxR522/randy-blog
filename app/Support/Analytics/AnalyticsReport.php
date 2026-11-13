<?php

namespace App\Support\Analytics;

use App\Models\Article;
use App\Models\ArticleSlugRedirect;
use Illuminate\Support\Facades\Cache;

/**
 * The GA4 figures of the analytics dashboard (ADM-ANA-2, ADM-ANA-3), cached for one hour per period (ADM-ANA-5).
 *
 * @phpstan-type Share array{label: string, share: int}
 * @phpstan-type Kpi array{value: int, change: int|null}
 * @phpstan-type Raw array{
 *     kpis: array{users: Kpi, sessions: Kpi, pageViews: Kpi, engagementSeconds: Kpi},
 *     daily: list<array{date: string, views: int}>,
 *     pages: list<array{path: string, views: int}>,
 *     sources: list<Share>,
 *     devices: list<Share>,
 *     countries: list<Share>,
 * }
 */
class AnalyticsReport
{
    private const int CacheSeconds = 3600;

    private const int TopArticles = 10;

    private const int TopShares = 5;

    /**
     * Pages fetched before they are grouped by article: one article can answer on several paths.
     */
    private const int PagesFetched = 200;

    private const string ArticlePathPrefix = '/articles/';

    /**
     * @var array<string, string>
     */
    private const array Channels = [
        'Direct' => 'Direct',
        'Organic Search' => 'Recherche organique',
        'Paid Search' => 'Recherche payante',
        'Organic Social' => 'Réseaux sociaux',
        'Paid Social' => 'Réseaux sociaux payants',
        'Referral' => 'Sites référents',
        'Email' => 'Email',
        'Display' => 'Affichage',
        'Organic Video' => 'Vidéo',
        'Unassigned' => 'Non attribué',
    ];

    /**
     * @var array<string, string>
     */
    private const array Devices = ['mobile' => 'Mobile', 'desktop' => 'Ordinateur', 'tablet' => 'Tablette'];

    /**
     * French names of the countries the blog is read from; GA4's English name is shown for any other.
     *
     * @var array<string, string>
     */
    private const array Countries = [
        'MG' => 'Madagascar', 'FR' => 'France', 'CA' => 'Canada', 'BE' => 'Belgique', 'MU' => 'Maurice',
        'RE' => 'La Réunion', 'YT' => 'Mayotte', 'KM' => 'Comores', 'CH' => 'Suisse', 'US' => 'États-Unis',
        'DE' => 'Allemagne', 'GB' => 'Royaume-Uni', 'IT' => 'Italie', 'ES' => 'Espagne', 'SN' => 'Sénégal',
        'CI' => 'Côte d’Ivoire', 'CM' => 'Cameroun', 'MA' => 'Maroc', 'DZ' => 'Algérie', 'TN' => 'Tunisie',
        'CN' => 'Chine', 'IN' => 'Inde', 'ZA' => 'Afrique du Sud', 'SC' => 'Seychelles', 'GR' => 'Grèce',
        'PT' => 'Portugal', 'LU' => 'Luxembourg', 'NL' => 'Pays-Bas', 'JP' => 'Japon', 'RU' => 'Russie',
        'BR' => 'Brésil', 'AU' => 'Australie', 'SE' => 'Suède', 'PL' => 'Pologne', 'TR' => 'Turquie',
        'EG' => 'Égypte', 'LB' => 'Liban', 'GA' => 'Gabon', 'CG' => 'Congo', 'CD' => 'RD Congo',
        'BF' => 'Burkina Faso', 'ML' => 'Mali', 'BJ' => 'Bénin', 'TG' => 'Togo', 'HT' => 'Haïti',
    ];

    public function __construct(private readonly Ga4Client $client) {}

    /**
     * Figures ready for the page, or null when GA4 is not configured or unreachable (the failure is not cached).
     * `$refresh` ignores the cached reports and replaces them, keeping the old ones when Google fails.
     *
     * @return array{
     *     kpis: array{users: Kpi, sessions: Kpi, pageViews: Kpi, engagementSeconds: Kpi},
     *     daily: list<array{date: string, views: int}>,
     *     topArticles: list<array{id: int, title: string, views: int}>,
     *     sources: list<Share>,
     *     devices: list<Share>,
     *     countries: list<Share>,
     * }|null
     */
    public function forPeriod(AnalyticsPeriod $period, bool $refresh = false): ?array
    {
        try {
            $raw = $this->fetch($period, $refresh);
        } catch (Ga4Exception) {
            return null;
        }

        return [
            'kpis' => $raw['kpis'],
            'daily' => $raw['daily'],
            'topArticles' => $this->topArticles($raw['pages']),
            'sources' => $raw['sources'],
            'devices' => $raw['devices'],
            'countries' => $raw['countries'],
        ];
    }

    private function cacheKey(AnalyticsPeriod $period, string $name): string
    {
        return "analytics.report.{$period->value}.{$name}";
    }

    /**
     * @return Raw
     *
     * @throws Ga4Exception
     */
    private function fetch(AnalyticsPeriod $period, bool $refresh): array
    {
        $current = $period->currentRange();

        $requests = [
            'kpis' => $this->kpisRequest($period),
            'daily' => $this->dailyRequest($period),
            'pages' => $this->pagesRequest($current),
            'sources' => $this->sharesRequest($current, 'sessionDefaultChannelGroup'),
            'devices' => $this->sharesRequest($current, 'deviceCategory'),
            'countries' => $this->sharesRequest($current, 'countryId'),
        ];

        // Each report is cached on its own: when Google leaves one unanswered, the others are kept and the next
        // visit only asks for the missing one.
        $reports = [];

        foreach (array_keys($requests) as $name) {
            $cached = $refresh ? null : Cache::get($this->cacheKey($period, $name));

            if (is_array($cached)) {
                $reports[$name] = $cached;
                unset($requests[$name]);
            }
        }

        foreach ($this->client->runReports($requests) as $name => $report) {
            if ($report !== null) {
                Cache::put($this->cacheKey($period, $name), $report, self::CacheSeconds);
                $reports[$name] = $report;
            }
        }

        $missing = array_diff(array_keys($requests), array_keys($reports));

        if ($missing !== []) {
            throw new Ga4Exception('GA4 left no answer for: '.implode(', ', $missing).'.');
        }

        return [
            'kpis' => $this->kpis($reports['kpis']),
            'daily' => $this->daily($period, $reports['daily']),
            'pages' => $this->pages($reports['pages']),
            'sources' => $this->shares($reports['sources'], fn (string $name): string => self::Channels[$name] ?? $name),
            'devices' => $this->shares($reports['devices'], fn (string $name): string => self::Devices[strtolower($name)] ?? $name),
            'countries' => $this->shares($reports['countries'], fn (string $code): string => self::Countries[strtoupper($code)] ?? $code),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function kpisRequest(AnalyticsPeriod $period): array
    {
        return [
            'dateRanges' => [
                ['name' => 'current', ...$period->currentRange()],
                ['name' => 'previous', ...$period->previousRange()],
            ],
            'metrics' => [
                ['name' => 'activeUsers'],
                ['name' => 'sessions'],
                ['name' => 'screenPageViews'],
                ['name' => 'userEngagementDuration'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $report
     * @return array{users: Kpi, sessions: Kpi, pageViews: Kpi, engagementSeconds: Kpi}
     */
    private function kpis(array $report): array
    {
        $ranges = ['current' => [0, 0, 0, 0], 'previous' => [0, 0, 0, 0]];

        foreach ($this->rows($report) as $row) {
            $name = $row['dimensions'][0] ?? 'current';

            if (isset($ranges[$name])) {
                $ranges[$name] = array_map(intval(...), $row['metrics']) + [0, 0, 0, 0];
            }
        }

        [$users, $sessions, $views, $engagement] = $ranges['current'];
        [$previousUsers, $previousSessions, $previousViews, $previousEngagement] = $ranges['previous'];

        // Average engagement time per active user, in seconds.
        $perUser = fn (int $seconds, int $people): int => $people > 0 ? intdiv($seconds, $people) : 0;

        return [
            'users' => $this->kpi($users, $previousUsers),
            'sessions' => $this->kpi($sessions, $previousSessions),
            'pageViews' => $this->kpi($views, $previousViews),
            'engagementSeconds' => $this->kpi($perUser($engagement, $users), $perUser($previousEngagement, $previousUsers)),
        ];
    }

    /**
     * @return Kpi
     */
    private function kpi(int $value, int $previous): array
    {
        return [
            'value' => $value,
            'change' => $previous > 0 ? (int) round(($value - $previous) / $previous * 100) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dailyRequest(AnalyticsPeriod $period): array
    {
        return [
            'dateRanges' => [$period->currentRange()],
            'dimensions' => [['name' => 'date']],
            'metrics' => [['name' => 'screenPageViews']],
            'orderBys' => [['dimension' => ['dimensionName' => 'date']]],
            'limit' => 200,
        ];
    }

    /**
     * One entry per day of the period, zero for the days GA4 has no row for.
     *
     * @param  array<string, mixed>  $report
     * @return list<array{date: string, views: int}>
     */
    private function daily(AnalyticsPeriod $period, array $report): array
    {
        $views = [];

        foreach ($this->rows($report) as $row) {
            $views[$row['dimensions'][0]] = (int) ($row['metrics'][0] ?? 0);
        }

        $days = [];
        $day = $period->startDate();

        for ($index = 0; $index < $period->value; $index++) {
            $days[] = ['date' => $day->toDateString(), 'views' => $views[$day->format('Ymd')] ?? 0];
            $day = $day->addDay();
        }

        return $days;
    }

    /**
     * @param  array{startDate: string, endDate: string}  $range
     * @return array<string, mixed>
     */
    private function pagesRequest(array $range): array
    {
        return [
            'dateRanges' => [$range],
            'dimensions' => [['name' => 'pagePath']],
            'metrics' => [['name' => 'screenPageViews']],
            'dimensionFilter' => ['filter' => [
                'fieldName' => 'pagePath',
                'stringFilter' => ['matchType' => 'BEGINS_WITH', 'value' => self::ArticlePathPrefix],
            ]],
            'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
            'limit' => self::PagesFetched,
        ];
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<array{path: string, views: int}>
     */
    private function pages(array $report): array
    {
        return array_map(
            fn (array $row): array => ['path' => $row['dimensions'][0], 'views' => (int) ($row['metrics'][0] ?? 0)],
            $this->rows($report),
        );
    }

    /**
     * @param  array{startDate: string, endDate: string}  $range
     * @return array<string, mixed>
     */
    private function sharesRequest(array $range, string $dimension): array
    {
        return [
            'dateRanges' => [$range],
            'dimensions' => [['name' => $dimension]],
            'metrics' => [['name' => 'sessions']],
            'orderBys' => [['metric' => ['metricName' => 'sessions'], 'desc' => true]],
            'limit' => 50,
        ];
    }

    /**
     * Share of each value of a dimension in the total, biggest first (the board shows five bars).
     *
     * @param  array<string, mixed>  $report
     * @param  callable(string): string  $translate
     * @return list<Share>
     */
    private function shares(array $report, callable $translate): array
    {
        $rows = $this->rows($report);
        $total = array_sum(array_map(fn (array $row): int => (int) ($row['metrics'][0] ?? 0), $rows));

        if ($total === 0) {
            return [];
        }

        $shares = [];

        foreach (array_slice($rows, 0, self::TopShares) as $row) {
            $share = (int) round((int) ($row['metrics'][0] ?? 0) / $total * 100);

            // A bar that rounds to 0 % says nothing.
            if ($share > 0) {
                $shares[] = ['label' => $translate($row['dimensions'][0]), 'share' => $share];
            }
        }

        return $shares;
    }

    /**
     * Groups the GA4 pages by article (current slug or an old one) and keeps the ten most viewed.
     *
     * @param  list<array{path: string, views: int}>  $pages
     * @return list<array{id: int, title: string, views: int}>
     */
    private function topArticles(array $pages): array
    {
        $viewsBySlug = [];

        foreach ($pages as $page) {
            $slug = $this->slugOf($page['path']);

            if ($slug !== null) {
                $viewsBySlug[$slug] = ($viewsBySlug[$slug] ?? 0) + $page['views'];
            }
        }

        if ($viewsBySlug === []) {
            return [];
        }

        $slugs = array_keys($viewsBySlug);
        $articles = Article::query()->whereIn('slug', $slugs)->get(['id', 'title', 'slug']);
        $articleBySlug = $articles->keyBy('slug');

        $redirects = ArticleSlugRedirect::query()
            ->whereIn('old_slug', array_diff($slugs, $articleBySlug->keys()->all()))
            ->with('article:id,title,slug')
            ->get();

        $viewsByArticle = [];
        $titles = [];

        foreach ($viewsBySlug as $slug => $views) {
            $article = $articleBySlug->get($slug) ?? $redirects->firstWhere('old_slug', $slug)?->article;

            if ($article instanceof Article) {
                $viewsByArticle[$article->id] = ($viewsByArticle[$article->id] ?? 0) + $views;
                $titles[$article->id] = $article->title;
            }
        }

        arsort($viewsByArticle);

        $top = [];

        foreach (array_slice($viewsByArticle, 0, self::TopArticles, true) as $id => $views) {
            $top[] = ['id' => $id, 'title' => $titles[$id], 'views' => $views];
        }

        return $top;
    }

    /**
     * `/articles/{slug}`, `/articles/{slug}/` or `/articles/{slug}.md` give the slug; anything deeper is not an article.
     */
    private function slugOf(string $path): ?string
    {
        $slug = rawurldecode(trim(substr(explode('?', $path)[0], strlen(self::ArticlePathPrefix)), '/'));
        $slug = preg_replace('/\.md$/', '', $slug) ?? $slug;

        return $slug === '' || str_contains($slug, '/') ? null : $slug;
    }

    /**
     * Rows of a GA4 report as plain lists of dimension and metric values.
     *
     * @param  array<string, mixed>  $report
     * @return list<array{dimensions: list<string>, metrics: list<string>}>
     */
    private function rows(array $report): array
    {
        $rows = [];

        foreach ((array) ($report['rows'] ?? []) as $row) {
            $rows[] = [
                'dimensions' => array_values(array_map(fn (array $value): string => (string) ($value['value'] ?? ''), (array) ($row['dimensionValues'] ?? []))),
                'metrics' => array_values(array_map(fn (array $value): string => (string) ($value['value'] ?? '0'), (array) ($row['metricValues'] ?? []))),
            ];
        }

        return $rows;
    }
}
