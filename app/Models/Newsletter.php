<?php

namespace App\Models;

use App\NewsletterAudience;
use App\NewsletterStatus;
use Carbon\CarbonImmutable;
use Database\Factories\NewsletterFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * An email composed in the admin for the confirmed subscribers (spec §5.5.3).
 *
 * @property int $id
 * @property string $subject
 * @property string|null $preheader
 * @property string|null $content
 * @property string|null $html
 * @property NewsletterStatus $status
 * @property NewsletterAudience $audience
 * @property CarbonImmutable|null $scheduled_at
 * @property CarbonImmutable|null $sent_at
 * @property int $recipients_count
 * @property int $sent_count
 * @property int $failed_count
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['subject', 'preheader', 'content', 'html', 'status', 'audience', 'scheduled_at', 'sent_at', 'recipients_count', 'sent_count', 'failed_count'])]
class Newsletter extends Model
{
    /** @use HasFactory<NewsletterFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'draft',
        'audience' => 'all',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => NewsletterStatus::class,
            'audience' => NewsletterAudience::class,
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'recipients_count' => 'integer',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
        ];
    }

    /**
     * @return HasMany<NewsletterRecipient, $this>
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(NewsletterRecipient::class);
    }

    public function isDraft(): bool
    {
        return $this->status === NewsletterStatus::Draft;
    }

    /**
     * The `utm_campaign` of the article links (ADM-SUB-21).
     */
    public static function campaignSlug(string $subject): string
    {
        $slug = Str::slug($subject);

        return $slug !== '' ? $slug : 'newsletter';
    }
}
