<?php

namespace App\Http\Controllers;

use App\ArticleStatus;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Support\Seo\Seo;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Show a published article at its V1 URL, `/articles/{slug}`.
     *
     * Drafts and scheduled articles answer 404; archived ones 410, since they were public once (SEO-CRAWL-4).
     */
    public function __invoke(Article $article): Response
    {
        if (! $article->isPublished()) {
            abort($article->status === ArticleStatus::Archived ? 410 : 404);
        }

        $article->load(['categories', 'author']);

        return Inertia::render('article', [
            'seo' => Seo::article($article)->toArray(),
            'article' => ArticleResource::make($article)->resolve(),
            'previous' => $this->neighbour($article, older: true),
            'next' => $this->neighbour($article, older: false),
        ]);
    }

    /**
     * The published article just before (older) or after (newer) this one, ordered by publication date then id.
     *
     * @return array<string, mixed>|null
     */
    private function neighbour(Article $article, bool $older): ?array
    {
        $operator = $older ? '<' : '>';
        $direction = $older ? 'desc' : 'asc';

        $neighbour = Article::query()
            ->published()
            ->where(fn (Builder $query) => $query
                ->where('published_date', $operator, $article->published_date)
                ->orWhere(fn (Builder $query) => $query
                    ->where('published_date', $article->published_date)
                    ->where('id', $operator, $article->id)))
            ->orderBy('published_date', $direction)
            ->orderBy('id', $direction)
            ->first();

        return $neighbour ? ArticleCardResource::make($neighbour)->resolve() : null;
    }
}
