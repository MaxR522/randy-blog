<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin Article
 */
class ArticleCardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     id: int,
     *     title: string,
     *     url: string,
     *     cover: string|null,
     *     chapo: string,
     *     date: string|null,
     *     dateLabel: string|null,
     *     categories: array<int, array{id: int, name: string}>,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => Str::squish($this->title),
            'url' => route('articles.show', $this->slug),
            'cover' => $this->cover_photo,
            'chapo' => Str::limit(Str::squish(html_entity_decode(strip_tags($this->lead_paragraph ?? ''), ENT_QUOTES | ENT_HTML5)), 220),
            'date' => $this->published_date?->toIso8601String(),
            'dateLabel' => $this->published_date_label,
            'categories' => $this->whenLoaded('categories', fn () => $this->categories
                ->map(fn (Category $category): array => ['id' => $category->id, 'name' => $category->value])
                ->values()
                ->all(), []),
        ];
    }
}
