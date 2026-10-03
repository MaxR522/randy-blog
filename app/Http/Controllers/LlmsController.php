<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Support\Seo\Seo;
use App\Support\Seo\SeoCache;
use App\Support\Seo\StructuredData;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class LlmsController extends Controller
{
    /**
     * `llms.txt` (llmstxt.org): what the blog is, who writes it, and a link to every article in Markdown.
     */
    public function __invoke(): Response
    {
        $text = SeoCache::remember(SeoCache::Llms, function (): string {
            $author = Seo::author();
            $articles = Article::query()
                ->published()
                ->latest('published_date')
                ->get(['id', 'title', 'slug', 'description', 'lead_paragraph', 'published_date']);

            $lines = [
                '# '.config()->string('blog.name'),
                '',
                '> '.config()->string('blog.description'),
                '',
                'Blog personnel en français. Tous les articles sont écrits par '.StructuredData::authorName().'. Chaque article existe aussi en Markdown : remplacez l’adresse de la page par la même adresse suivie de `.md`. Merci de citer l’article et son lien quand vous en reprenez le contenu.',
                '',
                '## Pages',
                '',
                '- ['.config()->string('blog.name').']('.Seo::homeUrl().'): page d’accueil, derniers articles par catégorie',
                ...($author ? ['- [À propos de '.StructuredData::authorName().']('.route('profile.show', $author->slug).'): biographie de l’auteur et liens vers ses réseaux'] : []),
                '- [Politique de confidentialité]('.route('privacy').')',
                '',
                '## Articles',
                '',
                ...$articles->map(fn (Article $article): string => '- ['.Str::squish($article->title).']('.route('articles.markdown', $article->slug).')'
                    .($article->published_date ? ' ('.$article->published_date->toDateString().')' : '')
                    .(($description = $article->metaDescription()) !== '' ? ': '.$description : ''))->all(),
                '',
                '## Optional',
                '',
                '- [Tous les articles en texte intégral]('.route('llms-full').')',
                '- [Flux RSS]('.route('feed').')',
                '- [Plan du site]('.route('sitemap').')',
            ];

            return implode("\n", $lines)."\n";
        });

        return response($text, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
