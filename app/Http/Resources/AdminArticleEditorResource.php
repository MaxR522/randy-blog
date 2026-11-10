<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An article as the editor loads it: the stored fields, and what the header actions need.
 *
 * @mixin Article
 */
class AdminArticleEditorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     id: int,
     *     title: string,
     *     slug: string,
     *     leadParagraph: string,
     *     content: string,
     *     coverPhoto: string|null,
     *     coverPhotoCredit: string,
     *     description: string,
     *     keywords: string,
     *     status: string,
     *     categoryIds: array<int, int>,
     *     isPublished: bool,
     *     isSlugFrozen: bool,
     *     previewUrl: string,
     *     updatedAt: string|null,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'leadParagraph' => $this->lead_paragraph ?? '',
            'content' => $this->content,
            'coverPhoto' => $this->cover_photo,
            'coverPhotoCredit' => $this->cover_photo_credit ?? '',
            'description' => $this->description ?? '',
            'keywords' => $this->keywords ?? '',
            'status' => $this->status->value,
            'categoryIds' => $this->categories->map(fn (Category $category): int => $category->id)->values()->all(),
            'isPublished' => $this->isPublished(),
            // The URL no longer follows the title once visitors may have shared it (ADM-ART-64).
            'isSlugFrozen' => $this->published_date !== null,
            // « Aperçu » opens the same viewer panel as the article list (ADM-ART-3).
            'previewUrl' => route('admin.articles.preview', $this->resource),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
