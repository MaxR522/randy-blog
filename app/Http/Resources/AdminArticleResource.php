<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A row of the admin article list.
 *
 * @mixin Article
 */
class AdminArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     id: int,
     *     title: string,
     *     status: string,
     *     publishedAt: string|null,
     *     publishedAtLabel: string|null,
     *     publishedAtShortLabel: string|null,
     *     createdAt: string|null,
     *     createdAtLabel: string|null,
     *     createdAtShortLabel: string|null,
     *     categories: array<int, string>,
     *     previewUrl: string,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status->value,
            'publishedAt' => $this->published_date?->toIso8601String(),
            'publishedAtLabel' => $this->published_date_label,
            'publishedAtShortLabel' => $this->published_date_short_label,
            'createdAt' => $this->created_at?->toIso8601String(),
            'createdAtLabel' => $this->created_at_label,
            'createdAtShortLabel' => $this->created_at_short_label,
            'categories' => $this->categories->map(fn (Category $category): string => $category->value)->values()->all(),
            'previewUrl' => route('admin.articles.preview', $this->resource),
        ];
    }
}
