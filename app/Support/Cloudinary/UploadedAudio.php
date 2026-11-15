<?php

namespace App\Support\Cloudinary;

/**
 * An audio file stored on Cloudinary (resource type `video`), as the Upload API describes it.
 */
final readonly class UploadedAudio
{
    public function __construct(
        public string $url,
        public int $durationSeconds,
    ) {}
}
