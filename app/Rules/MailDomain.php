<?php

namespace App\Rules;

use App\Support\DnsResolver;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * The address's domain must be able to receive mail (PUB-SUB-2), as Laravel's `email:dns` checks,
 * but through {@see DnsResolver} so tests stay offline.
 */
class MailDomain implements ValidationRule
{
    public function __construct(private readonly DnsResolver $resolver) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $domain = is_string($value) ? str($value)->afterLast('@')->toString() : '';

        if ($domain === '' || ! $this->resolver->acceptsMail($domain)) {
            $fail('Veuillez saisir une adresse email valide.');
        }
    }
}
