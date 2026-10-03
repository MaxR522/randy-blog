<?php

namespace App\Support\Seo;

/**
 * Share and structured-data image URLs, cropped by Cloudinary (same URL rule as `resources/js/lib/cloudinary.ts`).
 * Images hosted elsewhere are used as they are, without dimensions.
 */
class ShareImage
{
    private const string UploadSegment = '/image/upload/';

    /**
     * Open Graph size (SEO-HEAD-7). JPEG, because some networks still reject WebP and AVIF.
     */
    public const int OpenGraphWidth = 1200;

    public const int OpenGraphHeight = 630;

    /**
     * Ratios Google asks for in article structured data, all at least 1200 px wide (SEO-LD-2).
     *
     * @var array<int, array{int, int}>
     */
    private const array StructuredDataSizes = [[1200, 675], [1200, 900], [1200, 1200]];

    /**
     * Open Graph image: 1200 × 630, cropped around the subject.
     *
     * @return array{url: string, width: int|null, height: int|null}
     */
    public static function openGraph(string $url): array
    {
        if (! self::isCloudinary($url)) {
            return ['url' => $url, 'width' => null, 'height' => null];
        }

        return [
            'url' => self::crop($url, self::OpenGraphWidth, self::OpenGraphHeight, 'f_jpg'),
            'width' => self::OpenGraphWidth,
            'height' => self::OpenGraphHeight,
        ];
    }

    /**
     * The image in 16:9, 4:3 and 1:1 for `BlogPosting.image`.
     *
     * @return list<string>
     */
    public static function structuredData(string $url): array
    {
        if (! self::isCloudinary($url)) {
            return [$url];
        }

        return array_map(
            fn (array $size): string => self::crop($url, $size[0], $size[1], 'f_auto'),
            self::StructuredDataSizes,
        );
    }

    /**
     * Cover of a sitemap or feed entry, limited to 1200 px wide.
     */
    public static function large(string $url): string
    {
        if (! self::isCloudinary($url)) {
            return $url;
        }

        return self::transform($url, 'w_1200,c_limit,f_jpg,q_auto');
    }

    private static function crop(string $url, int $width, int $height, string $format): string
    {
        return self::transform($url, "c_fill,g_auto,w_{$width},h_{$height},{$format},q_auto");
    }

    /**
     * Replace the stored transformations (V1 covers carry `f_auto,q_70`, which would override the format) with ours.
     */
    private static function transform(string $url, string $transformation): string
    {
        return (string) preg_replace(
            '#'.preg_quote(self::UploadSegment, '#').'(?:[a-z]{1,3}_[^/]*/)*#',
            self::UploadSegment.$transformation.'/',
            $url,
            1,
        );
    }

    private static function isCloudinary(string $url): bool
    {
        return str_contains($url, 'res.cloudinary.com') && str_contains($url, self::UploadSegment);
    }
}
