<?php

namespace App\Http\Controllers\Admin;

use App\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArticleRequest;
use App\Http\Requests\ArticleSuggestionRequest;
use App\Http\Requests\WordImportRequest;
use App\Http\Resources\AdminArticleEditorResource;
use App\Http\Resources\AdminArticleResource;
use App\Http\Resources\ArticleResource;
use App\MediaFolder;
use App\Models\Article;
use App\Models\Category;
use App\Support\ArticleHtml;
use App\Support\ArticleSlug;
use App\Support\ArticleSuggester;
use App\Support\ArticleSuggestionException;
use App\Support\Cloudinary\Cloudinary;
use App\Support\Cloudinary\CloudinaryException;
use App\Support\Seo\Seo;
use App\Support\WordImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
     * The article editor, empty (ADM-ART-10).
     */
    public function create(): Response
    {
        return Inertia::render('admin/article-editor', [
            'article' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Check a Word document written from the template, already turned into HTML in the browser, and return the fields
     * it fills (ADM-ART-40…43). Nothing is saved: the editor fills the form once the author confirms.
     * Problems in the document are part of a normal answer, not a failed request.
     */
    public function importWord(WordImportRequest $request): JsonResponse
    {
        return response()->json(WordImport::read($request->string('html')->toString()));
    }

    /**
     * Propose the SEO description and the keywords from the editor's current text (ADM-ART-26, ADM-ART-27).
     * Nothing is saved: the editor fills its fields and the author reviews them.
     */
    public function suggest(ArticleSuggestionRequest $request, ArticleSuggester $suggester): JsonResponse
    {
        try {
            return response()->json($suggester->suggest(
                $request->string('title')->squish()->toString(),
                $request->string('lead_paragraph')->toString(),
                $request->string('content')->toString(),
            ));
        } catch (ArticleSuggestionException $exception) {
            Log::warning($exception->getMessage());

            return response()->json(['message' => ArticleSuggestionException::UserMessage], 502);
        }
    }

    /**
     * Save a new article as a draft, or publish it straight away.
     */
    public function store(ArticleRequest $request, Cloudinary $cloudinary): RedirectResponse
    {
        $article = new Article(['author_id' => $request->user()?->id, 'status' => ArticleStatus::Draft]);

        $this->save($request, $article, $cloudinary);

        Inertia::flash($this->savedFlash($request, $article));

        return to_route('admin.articles.edit', $article);
    }

    /**
     * The editor filled with a saved article.
     */
    public function edit(Article $article): Response
    {
        $article->load('categories');

        return Inertia::render('admin/article-editor', [
            'article' => AdminArticleEditorResource::make($article)->resolve(),
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Save an article. The author never changes (ADM-ART-65); « Publier » also publishes it.
     */
    public function update(ArticleRequest $request, Article $article, Cloudinary $cloudinary): RedirectResponse
    {
        $this->save($request, $article, $cloudinary);

        return Inertia::flash($this->savedFlash($request, $article))->back();
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

    /**
     * The confirmation of a save, with the accessibility problems left in the content (A11Y-BODY-5).
     *
     * @return array{success: string, accessibilityWarnings?: list<string>}
     */
    private function savedFlash(ArticleRequest $request, Article $article): array
    {
        $warnings = ArticleHtml::accessibilityWarnings($article->content);

        return [
            'success' => $request->wantsToPublish() ? 'Article publié.' : 'Article enregistré.',
            ...($warnings === [] ? [] : ['accessibilityWarnings' => $warnings]),
        ];
    }

    /**
     * Fill, save and optionally publish the article. The new cover is uploaded first; the image it replaces is
     * deleted only once the article points to the new one, so a failed save never leaves a broken cover.
     */
    private function save(ArticleRequest $request, Article $article, Cloudinary $cloudinary): void
    {
        $previousCover = $article->cover_photo;
        $newCover = $request->file('cover') === null ? null : $this->uploadCover($request, $cloudinary);

        DB::transaction(function () use ($request, $article, $newCover): void {
            $leadParagraph = ArticleHtml::clean($request->input('lead_paragraph'));
            $content = ArticleHtml::clean($request->input('content'));
            $rawContent = trim(ArticleHtml::plainText($leadParagraph).' '.ArticleHtml::plainText($content));

            $article->fill([
                'title' => $request->string('title')->toString(),
                'lead_paragraph' => $leadParagraph ?: null,
                'content' => $content,
                'raw_content' => $rawContent,
                'cover_photo_credit' => $request->input('cover_photo_credit'),
                'description' => $request->input('description'),
                'keywords' => $request->input('keywords'),
            ]);

            $article->read_duration = Article::minutesToRead($article->wordCount());

            if ($newCover !== null) {
                $article->cover_photo = $newCover;
            } elseif ($request->boolean('remove_cover')) {
                $article->cover_photo = null;
            }

            $this->applySlug($request, $article);
            $article->save();

            $article->categories()->sync([
                ...array_map('intval', (array) $request->input('category_ids', [])),
                ...$this->createdCategoryIds($request),
            ]);

            if ($request->wantsToPublish()) {
                $article->publish();
            }
        });

        if ($previousCover !== null && $previousCover !== $article->cover_photo) {
            $cloudinary->delete($previousCover);
        }
    }

    /**
     * @throws ValidationException when Cloudinary refuses the file
     */
    private function uploadCover(ArticleRequest $request, Cloudinary $cloudinary): string
    {
        try {
            return $cloudinary->upload($request->file('cover'), MediaFolder::Articles)->url;
        } catch (CloudinaryException $exception) {
            Log::error($exception->getMessage());

            throw ValidationException::withMessages(['cover' => CloudinaryException::UserMessage]);
        }
    }

    /**
     * Until the first publication the URL follows the title, unless the author typed another one. After it, only a
     * typed change moves the URL, and the old one then redirects (ADM-ART-64).
     */
    private function applySlug(ArticleRequest $request, Article $article): void
    {
        $requestedSlug = $request->input('slug');
        $isFrozen = $article->published_date !== null;

        if ($isFrozen) {
            if (is_string($requestedSlug)) {
                ArticleSlug::change($article, $requestedSlug);
            }

            return;
        }

        $followsTitle = $requestedSlug === null || $requestedSlug === ArticleSlug::fromTitle($article->title);

        ArticleSlug::change($article, $followsTitle ? ArticleSlug::generate($article->title, $article->id) : $requestedSlug);
    }

    /**
     * Categories typed in the editor: an existing live one with the same name whatever the case, or a new one.
     *
     * @return array<int, int>
     */
    private function createdCategoryIds(ArticleRequest $request): array
    {
        return array_map(function (string $name): int {
            $existing = Category::query()->whereRaw('lower(value) = lower(?)', [$name])->first();

            return ($existing ?? Category::create(['key' => Str::upper($name), 'value' => $name]))->id;
        }, (array) $request->input('new_categories', []));
    }

    /**
     * Every live category, for the editor's picker.
     *
     * @return array<int, array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->orderByRaw('lower(unaccent(value))')
            ->get(['id', 'value'])
            ->map(fn (Category $category): array => ['id' => $category->id, 'name' => $category->value])
            ->all();
    }
}
