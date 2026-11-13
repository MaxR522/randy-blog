<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A row of the admin subscriber list (ADM-SUB-2).
 *
 * @mixin Subscription
 */
class SubscriptionResource extends JsonResource
{
    /**
     * @return array{
     *     id: int,
     *     email: string,
     *     status: string,
     *     subscribedAt: string|null,
     *     subscribedAtLabel: string|null,
     *     subscribedAtShortLabel: string|null,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'status' => $this->status->value,
            'subscribedAt' => $this->created_at?->toIso8601String(),
            'subscribedAtLabel' => $this->created_at === null ? null : Article::frenchDate($this->created_at),
            'subscribedAtShortLabel' => $this->created_at === null ? null : Article::shortFrenchDate($this->created_at),
        ];
    }
}
