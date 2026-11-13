<?php

namespace App\Http\Requests;

use App\Rules\MailDomain;
use App\Rules\NotDisposable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SubscribeRequest extends FormRequest
{
    /**
     * Honeypot field, hidden from people: a bot that fills it is answered as if it had subscribed (PUB-SUB-3).
     */
    public const string HoneypotField = 'website';

    /**
     * A well-formed address on a domain that receives mail, not a temporary one (PUB-SUB-2).
     * `bail` keeps the DNS lookup and the blocklist for addresses that passed the format check.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['bail', 'required', 'string', 'max:254', 'email:rfc', app(NotDisposable::class), app(MailDomain::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Veuillez saisir une adresse email valide.',
            'email.string' => 'Veuillez saisir une adresse email valide.',
            'email.max' => 'Veuillez saisir une adresse email valide.',
            'email.email' => 'Veuillez saisir une adresse email valide.',
        ];
    }

    public function isFromBot(): bool
    {
        return $this->filled(self::HoneypotField);
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }
}
