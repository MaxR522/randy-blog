<?php

namespace App\Support;

/**
 * Cloudinary delivery URLs (same rules as `resources/js/lib/cloudinary.ts`).
 */
class CloudinaryUrl
{
    public const string UploadSegment = '/image/upload/';

    /**
     * Transformation segments between `/image/upload/` and the version or public ID, such as V1's `f_auto,q_70/`.
     */
    private const string StoredTransformations = '(?:[a-z]{1,3}_[^/]*/)*';

    public static function isCloudinary(string $url): bool
    {
        return str_contains($url, 'res.cloudinary.com') && str_contains($url, self::UploadSegment);
    }

    /**
     * Replace the stored transformations (V1 covers carry `f_auto,q_70`, which would override the format) with ours.
     */
    public static function transform(string $url, string $transformation): string
    {
        return (string) preg_replace(
            '#'.preg_quote(self::UploadSegment, '#').self::StoredTransformations.'#',
            self::UploadSegment.$transformation.'/',
            $url,
            1,
        );
    }

    /**
     * Cloud name and public ID of a delivery URL, without transformations, version or extension.
     *
     * @return array{cloud: string, publicId: string}|null
     */
    public static function parse(string $url): ?array
    {
        $pattern = '#^https?://res\.cloudinary\.com/([^/]+)'.preg_quote(self::UploadSegment, '#')
            .self::StoredTransformations.'(?:v\d+/)?(.+?)(?:\.[a-z0-9]+)?(?:[?\#].*)?$#i';

        if (preg_match($pattern, $url, $matches) !== 1) {
            return null;
        }

        return ['cloud' => $matches[1], 'publicId' => rawurldecode($matches[2])];
    }
}
