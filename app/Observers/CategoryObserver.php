<?php

namespace App\Observers;

use App\Models\Category;
use App\Support\Seo\SeoCache;

/**
 * The feed and `llms-full.txt` print category names, so a rename or a deletion must refresh them.
 */
class CategoryObserver
{
    public function saved(Category $category): void
    {
        SeoCache::flush();
    }

    public function deleted(Category $category): void
    {
        SeoCache::flush();
    }
}
