<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ProfileResource;
use App\Models\User;
use App\Support\Seo\Seo;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Number of articles in « Derniers articles ».
     */
    private const int LatestArticles = 3;

    /**
     * Show the author profile page, `/profil/{slug}` (PUB-PROF-1 to 3).
     */
    public function __invoke(User $user): Response
    {
        return Inertia::render('profile', [
            'seo' => Seo::profile($user)->toArray(),
            'author' => ProfileResource::make($user)->resolve(),
            'latest' => ArticleCardResource::collection(
                $user->articles()
                    ->published()
                    ->latest('published_date')
                    ->limit(self::LatestArticles)
                    ->get(),
            )->resolve(),
        ]);
    }
}
