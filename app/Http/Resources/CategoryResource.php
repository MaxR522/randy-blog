<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Category
 */
class CategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     id: int,
     *     name: string,
     *     articlesCount: int,
     *     createdAt: string|null,
     *     createdAtLabel: string|null,
     *     createdAtShortLabel: string|null,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->value,
            'articlesCount' => $this->articles_count,
            'createdAt' => $this->created_at?->toIso8601String(),
            'createdAtLabel' => $this->created_at_label,
            'createdAtShortLabel' => $this->created_at_short_label,
        ];
    }
}
