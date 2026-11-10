<?php

namespace App\Support\Cloudinary;

use RuntimeException;

/**
 * Cloudinary is not configured, unreachable, or refused the upload.
 */
class CloudinaryException extends RuntimeException
{
    /**
     * Shown to the author whatever went wrong; the details go to the log.
     */
    public const string UserMessage = 'L’image n’a pas pu être envoyée. Réessayez dans quelques instants.';
}
