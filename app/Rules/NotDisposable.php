<?php

namespace App\Rules;

use App\Support\DisposableDomains;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Temporary email addresses are refused (PUB-SUB-2).
 */
class NotDisposable implements ValidationRule
{
    public function __construct(private readonly DisposableDomains $domains) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && $this->domains->isDisposable($value)) {
            $fail('Les adresses email temporaires ne sont pas acceptées.');
        }
    }
}
