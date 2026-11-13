<?php

namespace App\Support\Newsletter;

use App\Models\Article;
use App\Models\Category;
use App\Models\Newsletter;
use App\Support\ArticleHtml;
use App\Support\CloudinaryUrl;
use Dom\Element;
use Dom\HTMLDocument;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use TijsVerkoyen\CssToInlineStyles\CssToInlineStyles;

/**
 * Builds the HTML of a newsletter email (ADM-SUB-22): the single branded template of the `Newsletter` board,
 * with the author's content and an article card for each « Insérer un article » placeholder (ADM-SUB-21).
 * Mail clients ignore most stylesheets, so the content rules are inlined.
 */
class NewsletterRenderer
{
    /**
     * Width of the content column: the 600 px email minus its 40 px side padding.
     */
    public const int ContentWidth = 520;

    /**
     * Images are delivered at twice the column width, for high-density screens. No `f_auto`: Outlook cannot show WebP.
     */
    private const string BodyImageTransformation = 'c_limit,w_1040/q_auto';

    private const string CardCoverTransformation = 'c_fill,g_auto,ar_3:2/c_limit,w_1040/q_auto';

    private const int ChapoLength = 220;

    /**
     * @param  string  $unsubscribeUrl  the subscriber's own link (ADM-SUB-28), or the home page for a test
     */
    public function render(string $subject, ?string $preheader, ?string $content, string $unsubscribeUrl): string
    {
        $html = view('emails.newsletter.layout', [
            'subject' => $subject,
            'preheader' => trim($preheader ?? ''),
            'content' => $this->content($content, Newsletter::campaignSlug($subject)),
            'unsubscribeUrl' => $unsubscribeUrl,
            'social' => config('blog.social'),
        ])->render();

        $css = (string) file_get_contents(resource_path('views/emails/newsletter/content.css'));

        return (new CssToInlineStyles)->convert($html, $css);
    }

    /**
     * The cleaned content, its Cloudinary images sized for the column and its placeholders replaced by article cards.
     * A placeholder whose article is missing or not published is dropped.
     */
    private function content(?string $content, string $campaign): string
    {
        $cleaned = ArticleHtml::clean($content, allowArticleCards: true);

        if ($cleaned === '') {
            return '';
        }

        $document = HTMLDocument::createFromString('<!DOCTYPE html><html><body>'.$cleaned.'</body></html>', LIBXML_NOERROR);
        $body = $document->body ?? $document->createElement('body');

        $this->sizeImages($body);

        $placeholders = array_values(iterator_to_array($body->querySelectorAll('['.ArticleHtml::ArticleCardAttribute.']')));
        $articles = $this->articles($placeholders);
        $cards = [];

        foreach ($placeholders as $placeholder) {
            $article = $articles->get((int) $placeholder->getAttribute(ArticleHtml::ArticleCardAttribute));

            if ($article === null) {
                $placeholder->remove();

                continue;
            }

            $token = '%%article-card-'.Str::random(24).'%%';
            $cards[$token] = $this->card($article, $campaign);
            $placeholder->replaceWith($document->createTextNode($token));
        }

        return strtr(trim($body->innerHTML), $cards);
    }

    /**
     * @param  list<Element>  $placeholders
     * @return Collection<int, Article>
     */
    private function articles(array $placeholders): Collection
    {
        $ids = array_unique(array_map(
            fn (Element $placeholder): int => (int) $placeholder->getAttribute(ArticleHtml::ArticleCardAttribute),
            $placeholders,
        ));

        if ($ids === []) {
            return collect();
        }

        return Article::query()->published()->with('categories')->whereKey($ids)->get()->keyBy('id');
    }

    private function card(Article $article, string $campaign): string
    {
        $query = http_build_query([
            'utm_source' => 'newsletter',
            'utm_medium' => 'email',
            'utm_campaign' => $campaign,
        ]);

        $cover = $article->cover_photo;

        return view('emails.newsletter.article-card', [
            'url' => route('articles.show', $article->slug).'?'.$query,
            'title' => Str::squish($article->title),
            'chapo' => Str::limit(ArticleHtml::plainText($article->lead_paragraph), self::ChapoLength),
            'categories' => $article->categories->map(fn (Category $category): string => $category->value)->implode(' · '),
            'cover' => $cover !== null && CloudinaryUrl::isCloudinary($cover) ? CloudinaryUrl::transform($cover, self::CardCoverTransformation) : $cover,
        ])->render();
    }

    /**
     * Outlook ignores `max-width`, so an image wider than the column gets the column width as its attribute.
     */
    private function sizeImages(Element $body): void
    {
        foreach ($body->getElementsByTagName('img') as $image) {
            $source = trim($image->getAttribute('src') ?? '');

            if (CloudinaryUrl::isCloudinary($source)) {
                $image->setAttribute('src', CloudinaryUrl::transform($source, self::BodyImageTransformation));
            }

            if (! $image->hasAttribute('alt')) {
                $image->setAttribute('alt', '');
            }

            $width = (int) $image->getAttribute('width');

            if ($width === 0 || $width > self::ContentWidth) {
                $image->setAttribute('width', (string) self::ContentWidth);
                $image->removeAttribute('height');
            }
        }
    }
}
