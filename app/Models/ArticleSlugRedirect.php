<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An old slug of an article, redirected to its current URL (ADM-ART-64).
 *
 * @property int $id
 * @property int $article_id
 * @property string $old_slug
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['article_id', 'old_slug'])]
class ArticleSlugRedirect extends Model
{
    public const null UPDATED_AT = null;

    /**
     * @return BelongsTo<Article, $this>
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
