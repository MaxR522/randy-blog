<?php

namespace App\Http\Controllers\Admin;

use App\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminArticleResource;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Support\Seo\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    private const int PerPage = 10;

    /**
     * Status filter values of the URL (ADM-ART-5).
     *
     * @var array<string, ArticleStatus>
     */
    private const array Statuses = [
        'draft' => ArticleStatus::Draft,
        'published' => ArticleStatus::Published,
        'archived' => ArticleStatus::Archived,
    ];

    /**
     * List the articles, searched by title and filtered by status from the query string.
     *
     * Drafts come first, newest created first; then published and archived articles, newest published first (ADM-ART-4).
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $search = $request->string('q')->trim()->toString();
        $status = array_key_exists($request->string('status')->toString(), self::Statuses) ? $request->string('status')->toString() : null;
        $statusValue = $status === null ? null : self::Statuses[$status];

        $articles = Article::query()
            ->with('categories')
            ->when($search !== '', fn ($query) => $query->whereRaw(
                'unaccent(title) ILIKE unaccent(?)',
                ['%'.addcslashes($search, '%_\\').'%'],
            ))
            ->when($statusValue !== null, fn ($query) => $query->where('status', $statusValue))
            ->orderByRaw('status = ? desc', [ArticleStatus::Draft->value])
            ->orderByRaw('case when status = ? then created_at else published_date end desc nulls last', [ArticleStatus::Draft->value])
            ->orderByDesc('id')
            ->paginate(self::PerPage)
            ->withQueryString();

        // Deleting the only row of the last page leaves the URL past the end.
        if ($articles->isEmpty() && $articles->currentPage() > 1) {
            return redirect($articles->url($articles->lastPage()));
        }

        return Inertia::render('admin/articles', [
            'articles' => [
                'data' => AdminArticleResource::collection($articles->items())->resolve(),
                'total' => $articles->total(),
                'currentPage' => $articles->currentPage(),
                'lastPage' => $articles->lastPage(),
                'previousUrl' => $articles->previousPageUrl(),
                'nextUrl' => $articles->nextPageUrl(),
            ],
            'filters' => ['q' => $search, 'status' => $status],
            'hasArticles' => $articles->total() > 0 || Article::query()->exists(),
        ]);
    }

    /**
     * Publish a draft or an archived article.
     */
    public function publish(Article $article): RedirectResponse
    {
        abort_unless($article->canBePublished(), 409);

        $article->publish();

        return Inertia::flash('success', 'Article publié.')->back();
    }

    /**
     * Archive a published article.
     */
    public function archive(Article $article): RedirectResponse
    {
        abort_unless($article->canBeArchived(), 409);

        $article->archive();

        return Inertia::flash('success', 'Article archivé.')->back();
    }

    /**
     * Soft delete a draft. Published and archived articles are archived instead, never deleted.
     */
    public function destroy(Article $article): RedirectResponse
    {
        abort_unless($article->canBeDeleted(), 409);

        $article->delete();

        return Inertia::flash('success', 'Article supprimé.')->back();
    }

    /**
     * Show any article as visitors would see it, with the preview banner (PUB-ART-13).
     *
     * `?integre=1` drops the navbar, footer and banner, for the viewer panel of the article list.
     */
    public function preview(Request $request, Article $article): Response
    {
        $article->load(['categories', 'author']);

        return Inertia::render('article', [
            'seo' => Seo::private($article->title)->toArray(),
            'article' => ArticleResource::make($article)->resolve(),
            'previous' => null,
            'next' => null,
            'isPreview' => true,
            'isPublished' => $article->isPublished(),
            'isEmbedded' => $request->boolean('integre'),
        ]);
    }
}
