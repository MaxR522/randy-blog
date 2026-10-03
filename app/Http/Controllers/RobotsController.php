<?php

namespace App\Http\Controllers;

use App\Support\Seo\Seo;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    /**
     * Paths no crawler needs: the admin panel (`/admin` also covers everything under `/admin/`), the subscription
     * links and search results (SEO-CRAWL-2). Everything else is open: no `Allow` line is needed.
     */
    private const array DisallowedPaths = ['/admin', '/abonnement/', '/recherche'];

    /**
     * AI crawlers, welcome both to answer with the blog's articles and to learn from them.
     * A crawler named in its own group ignores the `*` group, so each gets the same rules, stated explicitly.
     */
    private const array AiCrawlers = [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
        'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
        'PerplexityBot', 'Perplexity-User',
        'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'meta-externalagent',
        'CCBot', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai',
    ];

    /**
     * `robots.txt`, served by a route so the sitemap URL follows APP_URL. A copy that is not indexable closes everything.
     */
    public function __invoke(): Response
    {
        $lines = Seo::isIndexable()
            ? $this->productionRules()
            : ['User-agent: *', 'Disallow: /'];

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /**
     * @return list<string>
     */
    private function productionRules(): array
    {
        $rules = array_map(fn (string $path): string => "Disallow: {$path}", self::DisallowedPaths);

        return [
            'User-agent: *',
            ...$rules,
            '',
            '# AI assistants and search engines',
            ...array_map(fn (string $crawler): string => "User-agent: {$crawler}", self::AiCrawlers),
            ...$rules,
            '',
            'Sitemap: '.route('sitemap'),
        ];
    }
}
