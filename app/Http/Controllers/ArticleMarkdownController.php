<?php

namespace App\Http\Controllers;

use App\ArticleStatus;
use App\Models\Article;
use App\Support\ArticleMarkdown;
use Illuminate\Http\Response;

class ArticleMarkdownController extends Controller
{
    /**
     * A published article as Markdown, `/articles/{slug}.md`, for AI assistants and agents.
     *
     * Same visibility as the HTML page. The HTML page stays the one search engines index: the canonical points to it.
     */
    public function __invoke(Article $article): Response
    {
        if (! $article->isPublished()) {
            abort($article->status === ArticleStatus::Archived ? 410 : 404);
        }

        return response(ArticleMarkdown::document($article), 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Link' => '<'.route('articles.show', $article->slug).'>; rel="canonical"',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
