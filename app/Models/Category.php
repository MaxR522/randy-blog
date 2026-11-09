<?php

namespace App\Models;

use App\Observers\CategoryObserver;
use Carbon\CarbonImmutable;
use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $key
 * @property string $value
 * @property CarbonImmutable|null $created_at
 * @property-read int $articles_count only with `withCount('articles')`
 * @property-read string|null $created_at_label « 14 mars 2019 »
 * @property-read string|null $created_at_short_label « 7 nov. 2026 »
 */
#[Fillable(['key', 'value'])]
#[ObservedBy(CategoryObserver::class)]
class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return BelongsToMany<Article, $this>
     */
    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_categories')->withTimestamps();
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function createdAtLabel(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->created_at === null
            ? null
            : Article::frenchDate($this->created_at));
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function createdAtShortLabel(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->created_at
            ?->setTimezone(config()->string('app.display_timezone'))
            ->locale('fr')
            ->isoFormat('Do MMM YYYY'));
    }
}
