<?php

namespace App\Support;

use App\Models\Article;
use App\Models\Category;
use App\Support\Seo\StructuredData;
use Dom\Element;
use Dom\HTMLDocument;
use Dom\Node;
use Dom\Text;
use Illuminate\Support\Str;

/**
 * Articles as Markdown for AI assistants and agents (`/articles/{slug}.md`, `llms-full.txt`): the same text as the page,
 * without the page around it. Converts the {@see ArticleHtml} output, so only the elements it allows need handling.
 */
class ArticleMarkdown
{
    /**
     * Elements that start a block of their own; anything else is inline text.
     */
    private const array BlockElements = [
        'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'figure', 'figcaption', 'div', 'table', 'hr', 'video', 'iframe',
    ];

    /**
     * Stands for a `<br>` while whitespace is collapsed.
     */
    private const string LineBreak = "\u{1}";

    /**
     * The whole article: front matter, title, chapô, text, and the source to cite.
     */
    public static function document(Article $article): string
    {
        $article->loadMissing(['categories', 'author']);
        $title = Str::squish($article->title);
        $url = route('articles.show', $article->slug);
        $author = $article->author;

        $frontMatter = array_filter([
            'title' => $title,
            'url' => $url,
            'author' => $author ? StructuredData::authorName() : null,
            'author_url' => $author ? route('profile.show', $author->slug) : null,
            'published' => $article->published_date?->toIso8601String(),
            'updated' => ($article->updated_at ?? $article->published_date)?->toIso8601String(),
            'categories' => $article->categories->map(fn (Category $category): string => $category->value)->values()->all(),
            'description' => $article->metaDescription(),
            'language' => 'fr',
        ], fn (mixed $value): bool => $value !== null && $value !== '' && $value !== []);

        $yaml = collect($frontMatter)
            ->map(fn (mixed $value, string $key): string => $key.': '.json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE))
            ->implode("\n");

        $byline = $author ? 'Par '.StructuredData::authorName().' · ' : '';
        $date = $article->published_date_label ? "{$article->published_date_label} · " : '';

        return implode("\n\n", array_filter([
            "---\n{$yaml}\n---",
            "# {$title}",
            "*{$byline}{$date}{$article->readingTime()} min de lecture*",
            self::fromHtml($article->lead_paragraph),
            self::fromHtml($article->content),
            "---\n\nSource : [{$title}]({$url})",
        ])).
        "\n";
    }

    /**
     * Markdown for rich text, sanitized first.
     */
    public static function fromHtml(?string $html): string
    {
        $sanitized = ArticleHtml::sanitize($html);

        if ($sanitized === '') {
            return '';
        }

        $document = HTMLDocument::createFromString('<!DOCTYPE html><html><body>'.$sanitized.'</body></html>', LIBXML_NOERROR);

        return $document->body ? trim(self::blocks($document->body)) : '';
    }

    /**
     * The children of an element as blocks separated by a blank line; loose inline content becomes a paragraph.
     */
    private static function blocks(Node $parent): string
    {
        $blocks = [];
        $inline = '';

        foreach ($parent->childNodes as $node) {
            if ($node instanceof Element && in_array($node->localName, self::BlockElements, true)) {
                $blocks[] = self::paragraph($inline);
                $blocks[] = self::block($node);
                $inline = '';
            } else {
                $inline .= self::inline($node);
            }
        }

        $blocks[] = self::paragraph($inline);

        return implode("\n\n", array_filter($blocks, fn (string $block): bool => trim($block) !== ''));
    }

    private static function block(Element $element): string
    {
        return match ($element->localName) {
            'p' => self::paragraph(self::inlineChildren($element)),
            'h2', 'h3', 'h4' => str_repeat('#', (int) substr($element->localName, 1)).' '.self::paragraph(self::inlineChildren($element)),
            'ul', 'ol' => self::list($element, 0),
            'blockquote' => self::quote(self::blocks($element)),
            'figcaption' => ($caption = self::paragraph(self::inlineChildren($element))) === '' ? '' : "*{$caption}*",
            'table' => self::table($element),
            'hr' => '---',
            'video' => self::mediaLink('Vidéo', $element->getAttribute('src') ?? $element->querySelector('source')?->getAttribute('src')),
            'iframe' => self::mediaLink($element->getAttribute('title') ?: 'Vidéo', $element->getAttribute('src')),
            'div' => $element->classList->contains('callout-box') ? self::quote(self::blocks($element)) : self::blocks($element),
            default => self::blocks($element),
        };
    }

    private static function inline(Node $node): string
    {
        if ($node instanceof Text) {
            return self::escape($node->textContent ?? '');
        }

        if (! $node instanceof Element) {
            return '';
        }

        $content = fn (): string => self::inlineChildren($node);

        return match ($node->localName) {
            'br' => self::LineBreak,
            'strong', 'b' => self::wrap($content(), '**'),
            'em', 'i' => self::wrap($content(), '*'),
            's' => self::wrap($content(), '~~'),
            'a' => self::link($content(), $node->getAttribute('href')),
            'img' => '!['.self::escape($node->getAttribute('alt') ?? '').']('.($node->getAttribute('src') ?? '').')',
            default => in_array($node->localName, self::BlockElements, true) ? ' '.self::block($node).' ' : $content(),
        };
    }

    private static function inlineChildren(Node $parent): string
    {
        $text = '';

        foreach ($parent->childNodes as $node) {
            $text .= self::inline($node);
        }

        return $text;
    }

    /**
     * Collapse whitespace like a browser does, keeping `<br>` as a Markdown hard line break.
     */
    private static function paragraph(string $inline): string
    {
        $text = trim((string) preg_replace('/\s+/u', ' ', $inline));

        return (string) preg_replace('/ ?'.self::LineBreak.' ?/u', "  \n", $text);
    }

    /**
     * Bullets or numbers, nested lists indented by four spaces.
     */
    private static function list(Element $list, int $depth): string
    {
        $lines = [];
        $number = 1;

        foreach ($list->children as $item) {
            if ($item->localName !== 'li') {
                continue;
            }

            $text = '';
            $nested = [];

            foreach ($item->childNodes as $node) {
                if ($node instanceof Element && in_array($node->localName, ['ul', 'ol'], true)) {
                    $nested[] = self::list($node, $depth + 1);
                } else {
                    $text .= self::inline($node);
                }
            }

            $marker = $list->localName === 'ol' ? ($number++).'.' : '-';
            $lines[] = str_repeat(' ', $depth * 4).$marker.' '.self::paragraph($text);
            array_push($lines, ...$nested);
        }

        return implode("\n", $lines);
    }

    private static function quote(string $markdown): string
    {
        return implode("\n", array_map(
            fn (string $line): string => rtrim('> '.$line),
            explode("\n", $markdown),
        ));
    }

    /**
     * A GFM table; the first row is the header.
     */
    private static function table(Element $table): string
    {
        $rows = [];

        foreach ($table->querySelectorAll('tr') as $row) {
            $cells = [];

            foreach ($row->children as $cell) {
                if (in_array($cell->localName, ['th', 'td'], true)) {
                    $cells[] = str_replace('|', '\|', self::paragraph(str_replace(self::LineBreak, ' ', self::inlineChildren($cell))));
                }
            }

            $rows[] = $cells;
        }

        if ($rows === []) {
            return '';
        }

        $columns = max(array_map(count(...), $rows));
        $line = fn (array $cells): string => '| '.implode(' | ', array_pad($cells, $columns, '')).' |';

        $caption = $table->querySelector('caption');
        $lines = [
            ...(trim($caption->textContent ?? '') !== '' ? ['**'.self::paragraph(self::inlineChildren($caption)).'**', ''] : []),
            $line(array_shift($rows)),
            $line(array_fill(0, $columns, '---')),
            ...array_map($line, $rows),
        ];

        return implode("\n", $lines);
    }

    private static function link(string $text, ?string $href): string
    {
        $text = trim($text);

        if ($href === null || $href === '') {
            return $text;
        }

        return '['.($text === '' ? $href : $text).']('.str_replace([' ', ')'], ['%20', '%29'], $href).')';
    }

    private static function mediaLink(string $label, ?string $src): string
    {
        return $src ? '['.self::escape($label).']('.$src.')' : '';
    }

    /**
     * Emphasis markers must touch the text, so surrounding spaces move outside them.
     */
    private static function wrap(string $text, string $marker): string
    {
        if (trim($text) === '') {
            return $text;
        }

        $trimmed = trim($text);
        $before = substr($text, 0, strlen($text) - strlen(ltrim($text)));
        $after = substr($text, strlen(rtrim($text)));

        return $before.$marker.$trimmed.$marker.$after;
    }

    private static function escape(string $text): string
    {
        return (string) preg_replace('/([\\\\`*_\[\]])/', '\\\\$1', $text);
    }
}
