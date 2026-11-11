<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\LoginEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One login attempt on a known account, successful or not (ADM-SEC-6).
 *
 * @property int $id
 * @property int $user_id
 * @property string|null $ip
 * @property string|null $user_agent
 * @property bool $succeeded
 * @property bool $two_factor_used
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['user_id', 'ip', 'user_agent', 'succeeded', 'two_factor_used'])]
class LoginEvent extends Model
{
    /** @use HasFactory<LoginEventFactory> */
    use HasFactory, MassPrunable;

    public const null UPDATED_AT = null;

    /**
     * The Security tab lists this many events.
     */
    public const int HistoryLength = 50;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'succeeded' => 'boolean',
            'two_factor_used' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Events older than a year are deleted by `model:prune`: the tab only shows the last 50.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()->where('created_at', '<', now()->subYear());
    }
}
