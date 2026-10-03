<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Support\ArticleMarkdown;
use App\Support\Seo\SeoCache;
use Illuminate\Http\Response;

class LlmsFullController extends Controller
{
    /**
     * `llms-full.txt`: every published article in Markdown, newest first, in one file.
     */
    public function __invoke(): Response
    {
        $text = SeoCache::remember(SeoCache::LlmsFull, function (): string {
            $documents = [];

            Article::query()
                ->published()
                ->with(['categories', 'author'])
                ->latest('published_date')
                ->latest('id')
                ->chunk(50, function ($articles) use (&$documents): void {
                    foreach ($articles as $article) {
                        $documents[] = ArticleMarkdown::document($article);
                    }
                });

            return '# '.config()->string('blog.name')."\n\n> ".config()->string('blog.description')."\n\n".implode("\n", $documents);
        });

        return response($text, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
