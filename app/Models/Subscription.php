<?php

namespace App\Models;

use App\SubscriptionStatus;
use Carbon\CarbonImmutable;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\URL;

/**
 * A newsletter subscriber (spec §4.7). The V1 columns keep their meaning: `is_verified` and
 * `verified_at` mark a confirmed address, `unsubscribed_at` an unsubscribed one. New rows use
 * signed URLs, so `verification_token` stays empty.
 *
 * @property int $id
 * @property string $email
 * @property bool $is_verified
 * @property CarbonImmutable|null $verified_at
 * @property string|null $confirmed_ip
 * @property CarbonImmutable|null $last_confirmation_sent_at
 * @property CarbonImmutable|null $unsubscribed_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $deleted_at
 * @property-read SubscriptionStatus $status
 */
#[Fillable(['email', 'is_verified', 'verified_at', 'confirmed_ip', 'last_confirmation_sent_at', 'unsubscribed_at'])]
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory, MassPrunable, Notifiable, SoftDeletes;

    /**
     * The confirmation link stays valid this long (PUB-SUB-6).
     */
    public const int ConfirmationHours = 48;

    /**
     * A pending address gets at most one confirmation email in this window (PUB-SUB-5).
     */
    public const int ResendMinutes = 10;

    /**
     * Pending addresses never confirmed are purged after this many days (PUB-SUB-9).
     */
    public const int PendingRetentionDays = 30;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
            'last_confirmation_sent_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
        ];
    }

    /**
     * Addresses are compared lowercased and trimmed, so one person never has two rows.
     *
     * @return Attribute<string, string>
     */
    protected function email(): Attribute
    {
        return Attribute::set(fn (string $value): string => mb_strtolower(trim($value)));
    }

    /**
     * @return Attribute<SubscriptionStatus, never>
     */
    protected function status(): Attribute
    {
        return Attribute::get(fn (): SubscriptionStatus => $this->resolveStatus());
    }

    private function resolveStatus(): SubscriptionStatus
    {
        return match (true) {
            $this->unsubscribed_at !== null => SubscriptionStatus::Unsubscribed,
            $this->is_verified => SubscriptionStatus::Confirmed,
            default => SubscriptionStatus::Pending,
        };
    }

    /**
     * Only these addresses receive newsletters (PUB-SUB-7).
     *
     * @param  Builder<Subscription>  $query
     */
    #[Scope]
    protected function confirmed(Builder $query): void
    {
        $query->whereNull('unsubscribed_at')->where('is_verified', true);
    }

    /**
     * @param  Builder<Subscription>  $query
     */
    #[Scope]
    protected function pending(Builder $query): void
    {
        $query->whereNull('unsubscribed_at')->where('is_verified', false);
    }

    /**
     * @param  Builder<Subscription>  $query
     */
    #[Scope]
    protected function unsubscribed(Builder $query): void
    {
        $query->whereNotNull('unsubscribed_at');
    }

    /**
     * @param  Builder<Subscription>  $query
     */
    #[Scope]
    protected function withStatus(Builder $query, SubscriptionStatus $status): void
    {
        match ($status) {
            SubscriptionStatus::Confirmed => $query->confirmed(),
            SubscriptionStatus::Pending => $query->pending(),
            SubscriptionStatus::Unsubscribed => $query->unsubscribed(),
        };
    }

    /**
     * Whether a confirmation email may be sent now, without flooding a pending address (PUB-SUB-5).
     */
    public function canResendConfirmation(): bool
    {
        return $this->last_confirmation_sent_at === null
            || $this->last_confirmation_sent_at->addMinutes(self::ResendMinutes)->isPast();
    }

    public function confirmationUrl(): string
    {
        return URL::temporarySignedRoute('subscriptions.confirm', now()->addHours(self::ConfirmationHours), ['subscription' => $this->id]);
    }

    /**
     * One-click unsubscribe link for the newsletter and its `List-Unsubscribe` header (PUB-SUB-8). It never expires.
     */
    public function unsubscribeUrl(): string
    {
        return URL::signedRoute('subscriptions.unsubscribe', ['subscription' => $this->id]);
    }

    /**
     * Pending addresses never confirmed for 30 days are erased by `model:prune` (PUB-SUB-9, GDPR minimisation).
     * The clock restarts with each confirmation email, since a returning subscriber restarts as pending.
     * Soft-deleted V1 rows are included: erasing them is the point.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()
            ->withoutGlobalScope(SoftDeletingScope::class)
            ->whereNull('unsubscribed_at')
            ->where('is_verified', false)
            ->whereRaw('coalesce(last_confirmation_sent_at, created_at) < ?', [now()->subDays(self::PendingRetentionDays)]);
    }
}
