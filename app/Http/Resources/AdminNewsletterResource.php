<?php

namespace App\Http\Resources;

use App\Models\Article;
use App\Models\Newsletter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A newsletter in the admin: a row of « Newsletters envoyées » (ADM-SUB-10) and the composer's saved state.
 *
 * @mixin Newsletter
 */
class AdminNewsletterResource extends JsonResource
{
    /**
     * @return array{
     *     id: int,
     *     subject: string,
     *     preheader: string|null,
     *     status: string,
     *     audience: string,
     *     sentAtLabel: string|null,
     *     sentAtShortLabel: string|null,
     *     recipientsCount: int,
     *     sentCount: int,
     *     failedCount: int,
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'preheader' => $this->preheader,
            'status' => $this->status->value,
            'audience' => $this->audience->value,
            'sentAtLabel' => $this->sent_at === null ? null : Article::frenchDate($this->sent_at),
            'sentAtShortLabel' => $this->sent_at === null ? null : Article::shortFrenchDate($this->sent_at),
            'recipientsCount' => $this->recipients_count,
            'sentCount' => $this->sent_count,
            'failedCount' => $this->failed_count,
        ];
    }
}
