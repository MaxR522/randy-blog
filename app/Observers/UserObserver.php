<?php

namespace App\Observers;

use App\Models\User;
use App\Support\Seo\SeoCache;

/**
 * The sitemap dates the author page from the user's last change, so a profile edit must refresh the crawl files.
 * Other saves, such as the remember token written at login, leave them alone.
 */
class UserObserver
{
    /**
     * Columns that the author page or the crawl files show.
     *
     * @var list<string>
     */
    private const array PublicColumns = ['slug', 'display_name', 'avatar', 'avatar_credit', 'bio'];

    public function created(User $user): void
    {
        SeoCache::flush();
    }

    public function updated(User $user): void
    {
        if ($user->wasChanged(self::PublicColumns)) {
            SeoCache::flush();
        }
    }
}
