<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\ArticleHtml;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin User
 */
class ProfileResource extends JsonResource
{
    /**
     * Paragraphs with nothing to read (V1 bios end with an empty anchor paragraph).
     */
    private const string EmptyParagraph = '#<p>(?:\s|&nbsp;|\x{00A0}|<br\s*/?>|<span[^>]*>\s*</span>)*</p>#u';

    /**
     * Transform the resource into an array.
     *
     * @return array{
     *     name: string,
     *     fullName: string,
     *     url: string,
     *     avatar: string|null,
     *     avatarCredit: string|null,
     *     bioHtml: string,
     *     description: string,
     * }
     */
    public function toArray(Request $request): array
    {
        $bioHtml = trim((string) preg_replace(self::EmptyParagraph, '', ArticleHtml::sanitize($this->bio)));

        return [
            'name' => Str::squish($this->display_name ?? '') ?: $this->name,
            'fullName' => $this->name,
            'url' => route('profile.show', $this->slug),
            'avatar' => $this->avatar ?: null,
            'avatarCredit' => Str::squish($this->avatar_credit ?? '') ?: null,
            'bioHtml' => $bioHtml,
            'description' => $this->metaDescription(),
        ];
    }
}
