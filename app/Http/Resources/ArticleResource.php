<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Category;
use App\Support\ArticleHtml;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin Article
 */
class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     id: int,
     *     title: string,
     *     url: string,
     *     description: string,
     *     cover: string|null,
     *     coverAlt: string,
     *     coverCredit: string|null,
     *     chapoHtml: string,
     *     contentHtml: string,
     *     date: string|null,
     *     dateLabel: string|null,
     *     readingTime: int,
     *     categories: array<int, array{id: int, name: string}>,
     *     author: array{name: string, url: string}|null,
     * }
     */
    public function toArray(Request $request): array
    {
        $title = Str::squish($this->title);
        $chapo = Str::squish(html_entity_decode(strip_tags($this->lead_paragraph ?? ''), ENT_QUOTES | ENT_HTML5));

        return [
            'id' => $this->id,
            'title' => $title,
            'url' => route('articles.show', $this->slug),
            'description' => Str::squish($this->description ?? '') ?: Str::limit($chapo, 157, preserveWords: true),
            'cover' => $this->cover_photo,
            'coverAlt' => $title,
            'coverCredit' => Str::squish($this->cover_photo_credit ?? '') ?: null,
            'chapoHtml' => ArticleHtml::sanitize($this->lead_paragraph),
            'contentHtml' => ArticleHtml::sanitize($this->content),
            'date' => $this->published_date?->toIso8601String(),
            'dateLabel' => $this->published_date_label,
            'readingTime' => $this->readingTime(),
            'categories' => $this->whenLoaded('categories', fn () => $this->categories
                ->map(fn (Category $category): array => ['id' => $category->id, 'name' => $category->value])
                ->values()
                ->all(), []),
            'author' => $this->author ? [
                'name' => $this->author->display_name ?: $this->author->name,
                'url' => route('profile.show', $this->author->slug),
            ] : null,
        ];
    }
}
