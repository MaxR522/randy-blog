<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\SearchResultResource;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    /**
     * Results per page (PUB-SRCH-5).
     */
    private const int PerPage = 10;

    /**
     * Longer queries are cut: nobody types more, and it bounds the work of the full-text query.
     */
    private const int MaxQueryLength = 200;

    /**
     * Number of latest articles suggested when nothing matches (PUB-SRCH-6).
     */
    private const int LatestWhenEmpty = 3;

    /**
     * Show the search results for `?q=`, best match first. An empty query goes back to the home page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $query = $request->string('q')->squish()->limit(self::MaxQueryLength, '')->toString();

        if ($query === '') {
            return to_route('home');
        }

        $results = Article::query()
            ->published()
            ->search($query)
            ->with('categories')
            ->paginate(self::PerPage)
            ->withQueryString();

        return Inertia::render('search', [
            'query' => $query,
            'results' => [
                'data' => SearchResultResource::collection($results->items())->resolve(),
                'total' => $results->total(),
                'currentPage' => $results->currentPage(),
                'lastPage' => $results->lastPage(),
                'previousUrl' => $results->previousPageUrl(),
                'nextUrl' => $results->nextPageUrl(),
            ],
            'latest' => $results->total() === 0
                ? ArticleCardResource::collection(
                    Article::query()->published()->with('categories')->latest('published_date')->limit(self::LatestWhenEmpty)->get(),
                )->resolve()
                : [],
        ]);
    }
}
