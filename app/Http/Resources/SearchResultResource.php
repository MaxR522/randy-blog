<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Search result: the card data plus reading time and the excerpt with its highlighted matches.
 *
 * @mixin Article
 */
class SearchResultResource extends ArticleCardResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'readingTime' => $this->readingTime(),
            'excerpt' => $this->excerptSegments(),
        ];
    }

    /**
     * The excerpt cut into plain and highlighted runs, with « … » where the passage cuts the text.
     * Plain text, not HTML: the page renders each highlighted run in a `<mark>`.
     *
     * @return list<array{text: string, highlighted: bool}>
     */
    private function excerptSegments(): array
    {
        $excerpt = Str::squish($this->excerpt ?? '');
        $text = Str::squish($this->raw_content);
        $passage = str_replace([Article::HighlightStart, Article::HighlightEnd], '', $excerpt);

        if ($passage === '') {
            return [];
        }

        $position = mb_strpos($text, $passage);
        $before = $position === false ? '' : mb_substr($text, 0, $position);
        $after = $position === false ? '…' : mb_substr($text, $position + mb_strlen($passage));

        // ts_headline drops stop words at the edges of the passage (« Il suffit… ») and the final punctuation.
        if ($before !== '' && ! str_contains(trim($before), ' ')) {
            $excerpt = $before.$excerpt;
        } elseif ($before !== '') {
            $excerpt = '…'.$excerpt;
        }

        $excerpt .= preg_match('/^[\s\p{P}]*$/u', $after) ? rtrim($after) : '…';

        $segments = [];

        foreach (explode(Article::HighlightStart, $excerpt) as $index => $part) {
            [$highlighted, $plain] = $index === 0 ? ['', $part] : array_pad(explode(Article::HighlightEnd, $part, 2), 2, '');

            if ($highlighted !== '') {
                $segments[] = ['text' => $highlighted, 'highlighted' => true];
            }

            if ($plain !== '') {
                $segments[] = ['text' => $plain, 'highlighted' => false];
            }
        }

        return $segments;
    }
}
