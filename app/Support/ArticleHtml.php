<?php

namespace App\Support;

use Dom\Element;
use Dom\HTMLDocument;
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

    /**
     * Elements removed with their content: not article content, or unsafe.
     */
    private const array DroppedElements = [
        'script', 'style', 'noscript', 'template', 'object', 'embed', 'applet', 'form', 'input', 'button',
        'select', 'textarea', 'svg', 'math', 'head', 'title', 'meta', 'link', 'base', 'frame', 'frameset',
    ];

    private static ?HtmlSanitizer $sanitizer = null;

    /**
     * Sanitize rich text and normalize it for the public article page.
     */
    public static function sanitize(?string $html): string
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
        self::normalizeIframes($document, $body);
        self::normalizeVideos($body);
        self::wrapTables($document, $body);

        return trim($body->innerHTML);
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
        if (self::$sanitizer !== null) {
            return self::$sanitizer;
        }

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

        return self::$sanitizer = new HtmlSanitizer($config);
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
