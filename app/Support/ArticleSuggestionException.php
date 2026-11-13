<?php

namespace App\Support;

use RuntimeException;

/**
 * Gemini is not configured, unreachable, over its free-tier limit, or answered something unusable.
 */
class ArticleSuggestionException extends RuntimeException
{
    /**
     * Shown to the author whatever went wrong; the details go to the log.
     */
    public const string UserMessage = 'La génération n’a pas abouti. Réessayez dans quelques instants.';
}
