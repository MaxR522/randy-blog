<?php

namespace App\Models;

use App\NewsletterRecipientStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One subscriber of a newsletter: part of a draft's selection, then its delivery state (ADM-SUB-25, ADM-SUB-27).
 *
 * @property int $id
 * @property int $newsletter_id
 * @property int $subscription_id
 * @property NewsletterRecipientStatus $status
 * @property CarbonImmutable|null $sent_at
 * @property string|null $error
 */
#[Fillable(['newsletter_id', 'subscription_id', 'status', 'sent_at', 'error'])]
class NewsletterRecipient extends Model
{
    public $timestamps = false;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => NewsletterRecipientStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Newsletter, $this>
     */
    public function newsletter(): BelongsTo
    {
        return $this->belongsTo(Newsletter::class);
    }

    /**
     * @return BelongsTo<Subscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
