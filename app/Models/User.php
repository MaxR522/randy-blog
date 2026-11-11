<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\SecurityAlert;
use App\Observers\UserObserver;
use App\Support\ArticleHtml;
use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $slug
 * @property string|null $display_name
 * @property string|null $avatar
 * @property string|null $avatar_credit
 * @property string|null $bio
 * @property Carbon|null $email_verified_at
 * @property string|null $recovery_email
 * @property Carbon|null $recovery_email_verified_at
 * @property string|null $recovery_phone
 * @property Carbon|null $recovery_phone_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable(['name', 'email', 'password', 'display_name', 'avatar', 'avatar_credit', 'bio'])]
#[Hidden(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'])]
#[ObservedBy(UserObserver::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'recovery_email_verified_at' => 'datetime',
            'recovery_phone_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return HasMany<Article, $this>
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'author_id');
    }

    /**
     * @return HasMany<LoginEvent, $this>
     */
    public function loginEvents(): HasMany
    {
        return $this->hasMany(LoginEvent::class);
    }

    /**
     * A recovery email counts only once its link has been opened (ADM-SEC-1).
     */
    public function hasVerifiedRecoveryEmail(): bool
    {
        return $this->recovery_email !== null && $this->recovery_email_verified_at !== null;
    }

    /**
     * Where password reset links and security alerts go: the login email, plus the verified recovery email
     * (ADM-SEC-1, ADM-AUTH-2).
     *
     * @return list<string>
     */
    public function securityEmailAddresses(): array
    {
        return $this->hasVerifiedRecoveryEmail() ? [$this->email, (string) $this->recovery_email] : [$this->email];
    }

    /**
     * Reset links and security alerts also reach the recovery email; everything else goes to the login email.
     *
     * @return string|list<string>
     */
    public function routeNotificationForMail(Notification $notification): string|array
    {
        if ($notification instanceof ResetPassword || $notification instanceof SecurityAlert) {
            return $this->securityEmailAddresses();
        }

        return $this->email;
    }

    /**
     * Meta description of the author page (SEO-HEAD-3): the biography as plain text, cut on a word boundary.
     */
    public function metaDescription(): string
    {
        $bioText = Str::squish(html_entity_decode(strip_tags(ArticleHtml::sanitize($this->bio)), ENT_QUOTES | ENT_HTML5));

        return Str::limit($bioText, 157, '…', preserveWords: true);
    }
}
