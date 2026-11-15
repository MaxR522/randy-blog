<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleCardResource;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use App\Support\Seo\Seo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public home page. An article appears at most once on it (PUB-HOME-6): sections claim articles in page order,
 * « Dernières publications » first, then each category row from the top, then every page of « Tous les articles ».
 */
class HomeController extends Controller
{
    /**
     * Number of articles in « Dernières publications ».
     */
    private const int SectionSize = 5;

    /**
     * Number of category rows, and of articles in each row.
     */
    private const int CategoryRows = 4;

    private const int CategoryRowSize = 4;

    /**
     * A category gets a row only once it has this many published articles, counted before any article is claimed.
     */
    private const int CategoryMinimumArticles = 3;

    /**
     * Page size of « Tous les articles ».
     */
    private const int AllArticlesPerPage = 9;

    /**
     * Show the public home page.
     *
     * Every prop but `articles` is lazy so the « Voir plus » partial reload only queries the claimed IDs and the next page.
     * `?page=n` renders that page of « Tous les articles » server-side, so crawlers reach every article (SEO-CRAWL-6).
     * The layout is memoised in a local variable, not on the controller, which Octane may reuse across requests.
     */
    public function __invoke(Request $request): Response
    {
        $layout = null;
        $resolveLayout = function () use (&$layout): array {
            return $layout ??= $this->layout();
        };

        return Inertia::render('home', [
            'seo' => fn (): array => Seo::home(max(1, $request->integer('page', 1)))->toArray(),
            'authorUrl' => fn (): ?string => $this->authorUrl(),
            'latest' => fn (): array => ArticleCardResource::collection(
                $this->cards($resolveLayout()['latest']),
            )->resolve(),
            'categorySections' => fn (): array => $this->categorySections($resolveLayout()['rows']),
            'articles' => Inertia::scroll(fn () => ArticleCardResource::collection(
                Article::query()
                    ->published()
                    ->whereNotIn('id', $resolveLayout()['claimed'])
                    ->with('categories')
                    ->latest('published_date')
                    ->paginate(self::AllArticlesPerPage),
            )),
        ]);
    }

    /**
     * Profile page of the blog's single author, linked from the navbar.
     */
    private function authorUrl(): ?string
    {
        $slug = User::query()->oldest('id')->value('slug');

        return $slug ? route('profile.show', $slug) : null;
    }

    /**
     * Which articles each section above « Tous les articles » shows, as IDs only.
     *
     * Category rows are ordered by their newest published article, before anything is claimed. Each row takes its
     * newest articles not claimed higher up, so an article in several categories lands in the first row with room.
     * A row left with no article is skipped and the next category takes its place.
     *
     * @return array{latest: list<int>, rows: list<array{id: int, name: string, articleIds: list<int>}>, claimed: list<int>}
     */
    private function layout(): array
    {
        /** @var list<int> $latest */
        $latest = Article::query()
            ->published()
            ->latest('published_date')
            ->limit(self::SectionSize)
            ->pluck('id')
            ->all();

        $published = fn (Builder $query): Builder => self::onlyPublished($query);

        $categories = Category::query()
            ->select(['id', 'value'])
            ->whereHas('articles', $published, '>=', self::CategoryMinimumArticles)
            ->withMax(['articles as latest_published_date' => $published], 'published_date')
            ->orderByDesc('latest_published_date')
            ->orderBy('id')
            ->get();

        $articleIdsByCategory = Article::query()
            ->published()
            ->join('article_categories', 'article_categories.article_id', '=', 'articles.id')
            ->whereIn('article_categories.category_id', $categories->modelKeys())
            ->latest('published_date')
            ->orderByDesc('articles.id')
            ->get(['articles.id', 'article_categories.category_id'])
            ->groupBy('category_id')
            ->map(fn (Collection $articles): array => $articles->modelKeys());

        $claimed = array_fill_keys($latest, true);
        $rows = [];

        foreach ($categories as $category) {
            if (count($rows) === self::CategoryRows) {
                break;
            }

            $articleIds = [];

            foreach ($articleIdsByCategory->get($category->id, []) as $articleId) {
                if (! isset($claimed[$articleId])) {
                    $articleIds[] = $articleId;
                    $claimed[$articleId] = true;
                }

                if (count($articleIds) === self::CategoryRowSize) {
                    break;
                }
            }

            if ($articleIds !== []) {
                $rows[] = ['id' => $category->id, 'name' => $category->value, 'articleIds' => $articleIds];
            }
        }

        return ['latest' => $latest, 'rows' => $rows, 'claimed' => array_keys($claimed)];
    }

    /**
     * Category rows with their article cards, in the order the layout gave.
     *
     * @param  list<array{id: int, name: string, articleIds: list<int>}>  $rows
     * @return list<array{id: int, name: string, articles: array<mixed>}>
     */
    private function categorySections(array $rows): array
    {
        $cards = $this->cards(array_merge(...array_column($rows, 'articleIds')));

        return array_map(fn (array $row): array => [
            'id' => $row['id'],
            'name' => $row['name'],
            'articles' => ArticleCardResource::collection($cards->only($row['articleIds'])->values())->resolve(),
        ], $rows);
    }

    /**
     * Articles ready for a card, in the order of the given IDs.
     *
     * @param  list<int>  $ids
     * @return Collection<int, Article>
     */
    private function cards(array $ids): Collection
    {
        $positions = array_flip($ids);

        return Article::query()
            ->with('categories')
            ->findMany($ids)
            ->sortBy(fn (Article $article): int => $positions[$article->id])
            ->values();
    }

    /**
     * Restrict a relation query on articles to published ones.
     *
     * @param  Builder<Article>  $query
     * @return Builder<Article>
     */
    private static function onlyPublished(Builder $query): Builder
    {
        return $query->published();
    }
}
