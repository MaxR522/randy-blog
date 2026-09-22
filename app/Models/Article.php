<?php

namespace App\Models;

use App\ArticleStatus;
use Carbon\CarbonImmutable;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $lead_paragraph
 * @property string $content
 * @property string $raw_content
 * @property string|null $cover_photo
 * @property string|null $cover_photo_credit
 * @property string|null $description
 * @property string|null $keywords
 * @property ArticleStatus $status
 * @property CarbonImmutable|null $published_date
 * @property bool $is_featured
 * @property int $views
 * @property int $read_duration
 * @property int $author_id
 * @property-read string|null $published_date_label
 */
#[Fillable([
    'title',
    'slug',
    'lead_paragraph',
    'content',
    'raw_content',
    'cover_photo',
    'cover_photo_credit',
    'description',
    'keywords',
    'status',
    'published_date',
    'is_featured',
    'views',
    'shares',
    'read_duration',
    'origin',
    'author_id',
])]
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ArticleStatus::class,
            'published_date' => 'datetime',
            'is_featured' => 'boolean',
            'views' => 'integer',
            'shares' => 'integer',
            'read_duration' => 'integer',
        ];
    }

    /**
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'article_categories')->withTimestamps();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Only articles visible to visitors: published, with a publication date in the past.
     *
     * @param  Builder<Article>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', ArticleStatus::Published)
            ->whereNotNull('published_date')
            ->where('published_date', '<=', now());
    }

    /**
     * Publication date in French, in the display timezone: « 19 septembre 2026 », « 1er juillet 2026 ».
     *
     * @return Attribute<string|null, never>
     */
    protected function publishedDateLabel(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->published_date === null) {
                return null;
            }

            $date = $this->published_date->timezone(config('app.display_timezone'))->locale('fr');

            return ($date->day === 1 ? '1er' : $date->day).' '.$date->translatedFormat('F Y');
        });
    }
}
