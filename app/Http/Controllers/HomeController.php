<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleCardResource;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Inertia\Inertia;
use Inertia\Response;

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
     * A category gets a row only once it has this many published articles.
     */
    private const int CategoryMinimumArticles = 3;

    /**
     * Page size of « Tous les articles ».
     */
    private const int AllArticlesPerPage = 9;

    /**
     * Show the public home page.
     *
     * Every prop but `articles` is lazy so the « Voir plus » partial reload only queries the next page.
     */
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'authorUrl' => fn (): ?string => $this->authorUrl(),
            'latest' => fn (): array => ArticleCardResource::collection($this->latestArticles())->resolve(),
            'categorySections' => fn (): array => $this->categorySections(),
            'articles' => Inertia::scroll(fn () => ArticleCardResource::collection(
                Article::query()
                    ->published()
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
     * @return Collection<int, Article>
     */
    private function latestArticles(): Collection
    {
        return Article::query()
            ->published()
            ->with('categories')
            ->latest('published_date')
            ->limit(self::SectionSize)
            ->get();
    }

    /**
     * Categories with enough published articles, most recently fed first, each with its latest articles.
     *
     * @return array<int, array{id: int, name: string, articles: array<mixed>}>
     */
    private function categorySections(): array
    {
        $published = fn (Builder $query): Builder => self::onlyPublished($query);

        return Category::query()
            ->whereHas('articles', $published, '>=', self::CategoryMinimumArticles)
            ->withMax(['articles as latest_published_date' => $published], 'published_date')
            ->orderByDesc('latest_published_date')
            ->limit(self::CategoryRows)
            ->with('articles', fn (Relation $query): Relation => $query
                ->where(fn (Builder $query) => $published($query))
                ->latest('published_date')
                ->limit(self::CategoryRowSize))
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->value,
                'articles' => ArticleCardResource::collection($category->articles)->resolve(),
            ])
            ->all();
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
