<?php

namespace App\Support\Cloudinary;

/**
 * An image stored on Cloudinary, as the Upload API describes it.
 */
final readonly class UploadedImage
{
    public function __construct(
        public string $url,
        public int $width,
        public int $height,
    ) {}
}
