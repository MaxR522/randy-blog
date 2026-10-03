<?php

namespace App\Models;

use App\ArticleStatus;
use App\Observers\ArticleObserver;
use Carbon\CarbonImmutable;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string|null $published_date_label
 * @property-read string|null $excerpt only with the `search` scope
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
#[ObservedBy(ArticleObserver::class)]
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Markers around a highlighted match in a search excerpt: control characters, which article text never contains.
     */
    public const string HighlightStart = "\u{2}";

    public const string HighlightEnd = "\u{3}";

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
     * Full-text search on title and text (`search_vector`), French stemming, accent-insensitive, best match first.
     *
     * Adds `rank` and `excerpt`: a passage of the text around the matches, each match wrapped in
     * {@see self::HighlightStart} and {@see self::HighlightEnd}.
     *
     * @param  Builder<Article>  $query
     */
    #[Scope]
    protected function search(Builder $query, string $terms): void
    {
        $tsQuery = "websearch_to_tsquery('french_unaccent', ?)";
        $headlineOptions = 'StartSel='.self::HighlightStart.', StopSel='.self::HighlightEnd.', MaxWords=35, MinWords=20, MaxFragments=1';

        $query->select('articles.*')
            ->selectRaw("ts_rank_cd(search_vector, {$tsQuery}) as rank", [$terms])
            ->selectRaw("ts_headline('french_unaccent', raw_content, {$tsQuery}, ?) as excerpt", [$terms, $headlineOptions])
            ->whereRaw("search_vector @@ {$tsQuery}", [$terms])
            ->orderByDesc('rank')
            ->orderByDesc('published_date')
            ->orderByDesc('id');
    }

    /**
     * Whether visitors can read the article: same rule as the `published` scope.
     */
    public function isPublished(): bool
    {
        return $this->status === ArticleStatus::Published
            && $this->published_date !== null
            && $this->published_date->lte(now());
    }

    /**
     * Reading time in minutes: the stored value, or the word count at 230 words a minute when it was never computed.
     */
    public function readingTime(): int
    {
        if ($this->read_duration > 0) {
            return $this->read_duration;
        }

        return max(1, (int) ceil($this->wordCount() / 230));
    }

    /**
     * Meta description (SEO-HEAD-3): the `description` field, or the chapô cut on a word boundary with « … ».
     */
    public function metaDescription(): string
    {
        $chapo = Str::squish(html_entity_decode(strip_tags($this->lead_paragraph ?? ''), ENT_QUOTES | ENT_HTML5));

        return Str::squish($this->description ?? '') ?: Str::limit($chapo, 157, '…', preserveWords: true);
    }

    /**
     * Number of words in the chapô and the text, for `wordCount` in the structured data.
     */
    public function wordCount(): int
    {
        return (int) preg_match_all('/[\p{L}\p{N}]+/u', strip_tags($this->raw_content ?: $this->content));
    }

    /**
     * Publication date in French, in the display timezone: « 19 septembre 2026 », « 1er juillet 2026 ».
     *
     * @return Attribute<string|null, never>
     */
    protected function publishedDateLabel(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->published_date === null
            ? null
            : self::frenchDate($this->published_date));
    }

    /**
     * Format a date in French, in the display timezone, with « 1er » for the first day of the month.
     */
    private static function frenchDate(CarbonImmutable $date): string
    {
        /** @var CarbonImmutable $date */
        $date = $date->setTimezone(config()->string('app.display_timezone'))->locale('fr');

        return ($date->day === 1 ? '1er' : $date->day).' '.$date->translatedFormat('F Y');
    }
}
