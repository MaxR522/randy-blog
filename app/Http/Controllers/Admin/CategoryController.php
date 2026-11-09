<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    private const int PerPage = 10;

    /**
     * Sort options of the list: SQL expression, and direction when the URL gives none (ADM-CAT-7).
     *
     * Names sort on their unaccented lowercase form because the Alpine database image has no real
     * locale: its `en_US.utf8` compares bytes, which would put « Économie » after « Sport ».
     *
     * @var array<string, array{expression: string, direction: string}>
     */
    private const array Sorts = [
        'name' => ['expression' => 'lower(unaccent(value))', 'direction' => 'asc'],
        'date' => ['expression' => 'created_at', 'direction' => 'desc'],
    ];

    /**
     * List the categories, searched and sorted from the query string.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $search = $request->string('q')->trim()->toString();
        $sort = array_key_exists($request->string('sort')->toString(), self::Sorts) ? $request->string('sort')->toString() : 'name';
        $direction = in_array($request->query('direction'), ['asc', 'desc'], true) ? $request->query('direction') : self::Sorts[$sort]['direction'];

        $categories = Category::query()
            ->withCount('articles')
            ->when($search !== '', fn ($query) => $query->whereRaw(
                'unaccent(value) ILIKE unaccent(?)',
                ['%'.addcslashes($search, '%_\\').'%'],
            ))
            ->orderByRaw(self::Sorts[$sort]['expression'].' '.$direction)
            ->orderBy('id')
            ->paginate(self::PerPage)
            ->withQueryString();

        // Deleting the only row of the last page leaves the URL past the end.
        if ($categories->isEmpty() && $categories->currentPage() > 1) {
            return redirect($categories->url($categories->lastPage()));
        }

        return Inertia::render('admin/categories', [
            'categories' => [
                'data' => CategoryResource::collection($categories->items())->resolve(),
                'total' => $categories->total(),
                'currentPage' => $categories->currentPage(),
                'lastPage' => $categories->lastPage(),
                'previousUrl' => $categories->previousPageUrl(),
                'nextUrl' => $categories->nextPageUrl(),
            ],
            'filters' => ['q' => $search, 'sort' => $sort, 'direction' => $direction],
            'hasCategories' => $categories->total() > 0 || Category::query()->exists(),
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        Category::create($this->attributes($request));

        return Inertia::flash('success', 'Catégorie créée.')->back();
    }

    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($this->attributes($request));

        return Inertia::flash('success', 'Catégorie modifiée.')->back();
    }

    /**
     * Soft delete and detach. Articles left without a category stay published (ADM-CAT-5).
     */
    public function destroy(Category $category): RedirectResponse
    {
        DB::transaction(function () use ($category): void {
            $category->articles()->detach();
            $category->delete();
        });

        return Inertia::flash('success', 'Catégorie supprimée.')->back();
    }

    /**
     * @return array{key: string, value: string}
     */
    private function attributes(CategoryRequest $request): array
    {
        $name = $request->string('name')->toString();

        return ['key' => Str::upper($name), 'value' => $name];
    }
}
