<?php

namespace App\Support;

use Dom\Element;
use Dom\HTMLDocument;
use Illuminate\Support\Str;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerAction;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Sanitizes article rich text (TinyMCE and V1 content) into the HTML that `.article-body` styles.
 *
 * An allowlist sanitizer removes anything unsafe, then a DOM pass fixes the structure the design and
 * accessibility rules need: headings start at h2, YouTube iframes sit in `.video`, videos play only
 * from Cloudinary, tables scroll in their own focusable box, links opening a new tab carry `noopener`.
 */
class ArticleHtml
{
    /**
     * Classes editors may use; any other class is removed.
     */
    private const array AllowedClasses = ['callout-box', 'video'];

    /**
     * Hosts an iframe may load, any other iframe is removed.
     */
    private const array VideoHosts = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'];

    /**
     * Hosts a `<video>` or its `<source>` may load (V1 uploads live on Cloudinary), any other source is removed.
     */
    private const array MediaHosts = ['res.cloudinary.com'];

    private const string VideoTitle = 'Vidéo YouTube';

    private const string TableLabel = 'Tableau';

    private const string ZoomLabel = 'Agrandir l’image';

    /**
     * Widths offered to the browser for body images: phone, the 840 px column, and its 1.5× and 2× densities.
     */
    private const array BodyImageWidths = [480, 840, 1260, 1680];

    private const string BodyImageSizes = '(min-width: 1024px) 840px, 100vw';

    /**
     * Elements removed with their content: not article content, or unsafe.
     */
    private const array DroppedElements = [
        'script', 'style', 'noscript', 'template', 'object', 'embed', 'applet', 'form', 'input', 'button',
        'select', 'textarea', 'svg', 'math', 'head', 'title', 'meta', 'link', 'base', 'frame', 'frameset',
    ];

    /**
     * Attribute of the newsletter article card placeholder (ADM-SUB-21), whose value is the article ID.
     */
    public const string ArticleCardAttribute = 'data-article-card';

    private static ?HtmlSanitizer $sanitizer = null;

    private static ?HtmlSanitizer $newsletterSanitizer = null;

    /**
     * Sanitize rich text and normalize it for the public article page.
     *
     * With `$zoomableImages`, images not already in a link are wrapped in an `a.image-zoom` link to the image
     * itself, which the article page opens in its lightbox (only the article body asks for it, not feeds or bios).
     * Cloudinary images of the article body are also delivered resized, in the browser's best format.
     */
    public static function sanitize(?string $html, bool $zoomableImages = false): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $sanitized = self::sanitizer()->sanitize(self::withoutDroppedElements($html));

        if (trim($sanitized) === '') {
            return '';
        }

        [$document, $body] = self::parse($sanitized);

        self::normalizeHeadings($document, $body);
        self::normalizeClasses($body);
        self::normalizeLinks($body);
        self::normalizeImages($body);

        if ($zoomableImages) {
            self::wrapZoomableImages($document, $body);
            self::optimizeCloudinaryImages($body);
        }

        self::normalizeIframes($document, $body);
        self::normalizeVideos($body);
        self::wrapTables($document, $body);

        return trim($body->innerHTML);
    }

    /**
     * Sanitize rich text from the editor before it is stored (articles, chapô).
     *
     * Same allowlist and structure fixes as {@see self::sanitize()}, without the delivery-only changes (lazy loading,
     * resized Cloudinary URLs, table scroll boxes, zoom links): the stored HTML goes back into TinyMCE on the next
     * edit, and the page adds those when it renders.
     *
     * With `$allowArticleCards` (newsletter content only), the `div[data-article-card]` placeholders of the
     * « Insérer un article » button stay, with a numeric article ID; the email renderer replaces them.
     */
    public static function clean(?string $html, bool $allowArticleCards = false): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $sanitizer = $allowArticleCards ? self::newsletterSanitizer() : self::sanitizer();
        $sanitized = $sanitizer->sanitize(self::withoutDroppedElements($html));

        if (trim($sanitized) === '') {
            return '';
        }

        [$document, $body] = self::parse($sanitized);

        if ($allowArticleCards) {
            self::normalizeArticleCards($body);
        }

        self::normalizeHeadings($document, $body);
        self::normalizeClasses($body);
        self::normalizeLinks($body);
        self::normalizeIframes($document, $body);
        self::normalizeVideos($body);

        return trim($body->innerHTML);
    }

    /**
     * Accessibility problems in an article body, shown to the author after a save but never blocking it
     * (A11Y-BODY-5, standing in for TinyMCE's premium checker): images without alt text, skipped heading
     * levels and tables without a header row. The Encadré's own heading is left out of the heading order.
     *
     * @return list<string>
     */
    public static function accessibilityWarnings(?string $html): array
    {
        if ($html === null || trim($html) === '') {
            return [];
        }

        [, $body] = self::parse($html);
        $warnings = [];

        $imagesWithoutAlt = count(array_filter(
            iterator_to_array($body->getElementsByTagName('img')),
            fn (Element $image): bool => ! $image->hasAttribute('alt'),
        ));

        if ($imagesWithoutAlt > 0) {
            $warnings[] = $imagesWithoutAlt === 1
                ? 'Une image n’a pas de texte alternatif : ajoutez-en un, ou cochez « Image décorative ».'
                : "{$imagesWithoutAlt} images n’ont pas de texte alternatif : ajoutez-en un, ou cochez « Image décorative ».";
        }

        $previousLevel = 1;

        foreach ($body->querySelectorAll('h2, h3, h4') as $heading) {
            if ($heading->closest('.callout-box') !== null) {
                continue;
            }

            $level = (int) substr($heading->localName, 1);

            if ($level > $previousLevel + 1) {
                $warnings[] = $previousLevel === 1
                    ? 'Le texte commence par un « Titre '.($level - 1).' » : commencez par un « Titre 1 ».'
                    : 'Un « Titre '.($level - 1).' » suit directement un « Titre '.($previousLevel - 1).' » : il manque un « Titre '.$previousLevel.' » entre les deux.';

                break;
            }

            $previousLevel = $level;
        }

        $tablesWithoutHeader = count(array_filter(
            iterator_to_array($body->getElementsByTagName('table')),
            fn (Element $table): bool => $table->getElementsByTagName('th')->length === 0,
        ));

        if ($tablesWithoutHeader > 0) {
            $warnings[] = $tablesWithoutHeader === 1
                ? 'Un tableau n’a pas de ligne d’en-tête.'
                : "{$tablesWithoutHeader} tableaux n’ont pas de ligne d’en-tête.";
        }

        return $warnings;
    }

    /**
     * Plain text of rich text, blocks separated by a space, for `raw_content` (search, word count).
     */
    public static function plainText(?string $html): string
    {
        $spaced = (string) preg_replace('/<(br\b|\/(p|h[1-6]|li|div|blockquote|figcaption|td|th|caption)\b)/i', ' <$1', $html ?? '');

        return Str::squish(html_entity_decode(strip_tags($spaced), ENT_QUOTES | ENT_HTML5));
    }

    /**
     * @return array{HTMLDocument, Element}
     */
    private static function parse(string $html): array
    {
        $document = HTMLDocument::createFromString('<!DOCTYPE html><html><body>'.$html.'</body></html>', LIBXML_NOERROR);

        $body = $document->body ?? $document->createElement('body');

        return [$document, $body];
    }

    /**
     * Remove the dropped elements before sanitizing: the sanitizer ignores its drop list for elements
     * that belong in `<head>` (style, title, meta…), so their text (Word's CSS, for one) would leak into the body.
     */
    private static function withoutDroppedElements(string $html): string
    {
        [, $body] = self::parse($html);

        foreach ($body->querySelectorAll(implode(',', self::DroppedElements)) as $element) {
            $element->remove();
        }

        return $body->innerHTML;
    }

    /**
     * The sanitizer is stateless once configured, so one instance serves every request.
     */
    private static function sanitizer(): HtmlSanitizer
    {
        return self::$sanitizer ??= new HtmlSanitizer(self::config());
    }

    /**
     * The article allowlist, plus the article card placeholder of the newsletter.
     */
    private static function newsletterSanitizer(): HtmlSanitizer
    {
        return self::$newsletterSanitizer ??= new HtmlSanitizer(
            self::config()->allowAttribute(self::ArticleCardAttribute, 'div'),
        );
    }

    private static function config(): HtmlSanitizerConfig
    {
        $config = (new HtmlSanitizerConfig)
            ->defaultAction(HtmlSanitizerAction::Block)
            ->withMaxInputLength(-1)
            ->allowRelativeLinks()
            ->allowRelativeMedias()
            ->allowLinkSchemes(['http', 'https', 'mailto'])
            ->allowMediaSchemes(['http', 'https']);

        foreach (['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'span', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'caption', 'hr'] as $element) {
            $config = $config->allowElement($element);
        }

        $config = $config
            ->allowElement('a', ['href', 'title', 'target'])
            ->allowElement('img', ['src', 'alt', 'width', 'height', 'title'])
            ->allowElement('iframe', ['src', 'title', 'allowfullscreen', 'allow'])
            ->allowElement('video', ['src', 'poster', 'controls', 'width', 'height'])
            ->allowElement('source', ['src', 'type'])
            ->allowElement('div', ['class'])
            ->allowElement('abbr', ['title'])
            ->allowElement('th', ['scope', 'colspan', 'rowspan', 'abbr'])
            ->allowElement('td', ['colspan', 'rowspan'])
            ->allowElement('col', ['span'])
            ->allowAttribute('lang', '*')
            ->allowAttribute('id', '*')
            ->allowAttribute('aria-label', '*')
            ->allowAttribute('aria-describedby', '*')
            ->allowAttribute('role', '*');

        foreach (self::DroppedElements as $element) {
            $config = $config->dropElement($element);
        }

        return $config;
    }

    /**
     * An article card placeholder keeps only a numeric article ID; any other value removes the attribute.
     */
    private static function normalizeArticleCards(Element $body): void
    {
        foreach ($body->querySelectorAll('['.self::ArticleCardAttribute.']') as $element) {
            if (preg_match('/^[1-9]\d{0,18}$/', $element->getAttribute(self::ArticleCardAttribute) ?? '') !== 1) {
                $element->removeAttribute(self::ArticleCardAttribute);
            }
        }
    }

    /**
     * The page title is the only h1 and the design stops at h4: h1 becomes h2, h5 and h6 become h4.
     */
    private static function normalizeHeadings(HTMLDocument $document, Element $body): void
    {
        foreach (['h1' => 'h2', 'h5' => 'h4', 'h6' => 'h4'] as $from => $to) {
            foreach (iterator_to_array($body->getElementsByTagName($from)) as $heading) {
                $replacement = $document->createElement($to);

                foreach (iterator_to_array($heading->attributes) as $attribute) {
                    $replacement->setAttribute($attribute->name, $attribute->value);
                }

                $replacement->append(...iterator_to_array($heading->childNodes));
                $heading->replaceWith($replacement);
            }
        }
    }

    /**
     * Keep only the design's classes, and only `role="note"` (the Encadré).
     */
    private static function normalizeClasses(Element $body): void
    {
        foreach ($body->querySelectorAll('[class]') as $element) {
            $classes = array_values(array_intersect(
                preg_split('/\s+/', trim($element->getAttribute('class') ?? '')) ?: [],
                self::AllowedClasses,
            ));

            $classes === []
                ? $element->removeAttribute('class')
                : $element->setAttribute('class', implode(' ', $classes));
        }

        foreach ($body->querySelectorAll('[role]') as $element) {
            if ($element->getAttribute('role') !== 'note') {
                $element->removeAttribute('role');
            }
        }
    }

    /**
     * Links opening a new tab cannot reach back to this page.
     */
    private static function normalizeLinks(Element $body): void
    {
        foreach ($body->querySelectorAll('a[target]') as $link) {
            if ($link->getAttribute('target') === '_blank') {
                $link->setAttribute('rel', 'noopener noreferrer');
            } else {
                $link->removeAttribute('target');
            }
        }
    }

    /**
     * Body images sit below the cover: load them lazily. An image without alt text is treated as decorative.
     */
    private static function normalizeImages(Element $body): void
    {
        foreach ($body->getElementsByTagName('img') as $image) {
            $image->setAttribute('loading', 'lazy');
            $image->setAttribute('decoding', 'async');

            if (! $image->hasAttribute('alt')) {
                $image->setAttribute('alt', '');
            }
        }
    }

    /**
     * Wrap each image that is not already a link in a link to the image itself: it opens the full-screen viewer,
     * or the image file without JavaScript. The label names the action, so decorative images get a name too.
     */
    private static function wrapZoomableImages(HTMLDocument $document, Element $body): void
    {
        foreach (iterator_to_array($body->getElementsByTagName('img')) as $image) {
            $source = trim($image->getAttribute('src') ?? '');

            if ($source === '' || $image->closest('a') !== null) {
                continue;
            }

            $alt = trim($image->getAttribute('alt') ?? '');

            $link = $document->createElement('a');
            $link->setAttribute('href', $source);
            $link->setAttribute('class', 'image-zoom');
            $link->setAttribute('aria-label', $alt === '' ? self::ZoomLabel : self::ZoomLabel."\u{00A0}: ".$alt);

            $image->replaceWith($link);
            $link->append($image);
        }
    }

    /**
     * Serve Cloudinary body images at the width the column needs, with `f_auto,q_auto` (WebP or AVIF where supported).
     * The zoom link keeps the stored URL: the viewer fetches its own full-size version from it.
     */
    private static function optimizeCloudinaryImages(Element $body): void
    {
        foreach ($body->getElementsByTagName('img') as $image) {
            $source = trim($image->getAttribute('src') ?? '');

            if (! CloudinaryUrl::isCloudinary($source)) {
                continue;
            }

            $image->setAttribute('src', self::bodyImageUrl($source, self::BodyImageWidths[array_key_last(self::BodyImageWidths)]));
            $image->setAttribute('srcset', implode(', ', array_map(
                fn (int $width): string => self::bodyImageUrl($source, $width)." {$width}w",
                self::BodyImageWidths,
            )));
            $image->setAttribute('sizes', self::BodyImageSizes);
        }
    }

    private static function bodyImageUrl(string $url, int $width): string
    {
        return CloudinaryUrl::transform($url, "c_limit,w_{$width}/f_auto,q_auto");
    }

    /**
     * Only YouTube iframes stay, each with a title and inside a 16:9 `.video` box.
     */
    private static function normalizeIframes(HTMLDocument $document, Element $body): void
    {
        foreach (iterator_to_array($body->getElementsByTagName('iframe')) as $iframe) {
            $host = parse_url($iframe->getAttribute('src') ?? '', PHP_URL_HOST);

            if (! is_string($host) || ! in_array(strtolower($host), self::VideoHosts, true)) {
                $iframe->remove();

                continue;
            }

            if (trim($iframe->getAttribute('title') ?? '') === '') {
                $iframe->setAttribute('title', self::VideoTitle);
            }

            $parent = $iframe->parentElement;

            if ($parent?->localName === 'div' && $parent->classList->contains('video')) {
                continue;
            }

            $wrapper = $document->createElement('div');
            $wrapper->setAttribute('class', 'video');

            // A paragraph holding only the video would be invalid around a div: the wrapper replaces it.
            if ($parent?->localName === 'p' && $parent !== $body && trim($parent->textContent ?? '') === '' && $parent->childElementCount === 1) {
                $parent->replaceWith($wrapper);
            } else {
                $iframe->replaceWith($wrapper);
            }

            $wrapper->append($iframe);
        }
    }

    /**
     * Videos keep only Cloudinary sources and always show their controls; a video left with nothing to play is removed.
     * Only the metadata loads up front: the file downloads when the reader presses play.
     */
    private static function normalizeVideos(Element $body): void
    {
        foreach (iterator_to_array($body->getElementsByTagName('video')) as $video) {
            foreach ([$video, ...iterator_to_array($video->getElementsByTagName('source'))] as $element) {
                if ($element->hasAttribute('src') && ! self::isMediaHost($element->getAttribute('src') ?? '')) {
                    $element === $video ? $video->removeAttribute('src') : $element->remove();
                }
            }

            if (! $video->hasAttribute('src') && $video->getElementsByTagName('source')->length === 0) {
                $video->remove();

                continue;
            }

            if (! self::isMediaHost($video->getAttribute('poster') ?? '')) {
                $video->removeAttribute('poster');
            }

            $video->setAttribute('controls', '');
            $video->setAttribute('preload', 'metadata');
            $video->setAttribute('playsinline', '');
        }
    }

    private static function isMediaHost(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        return is_string($host) && in_array(strtolower($host), self::MediaHosts, true);
    }

    /**
     * Wide tables scroll inside their own box instead of the page; the box is focusable so it scrolls with the keyboard.
     */
    private static function wrapTables(HTMLDocument $document, Element $body): void
    {
        foreach (iterator_to_array($body->getElementsByTagName('table')) as $table) {
            $caption = $table->querySelector('caption');
            $label = trim($caption->textContent ?? '');

            $wrapper = $document->createElement('div');
            $wrapper->setAttribute('class', 'table-scroll');
            $wrapper->setAttribute('role', 'region');
            $wrapper->setAttribute('tabindex', '0');
            $wrapper->setAttribute('aria-label', $label !== '' ? $label : self::TableLabel);

            $table->replaceWith($wrapper);
            $wrapper->append($table);
        }
    }
}
