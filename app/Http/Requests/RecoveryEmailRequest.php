<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecoveryEmailRequest extends FormRequest
{
    /**
     * A recovery email, different from the login email, confirmed by the current password (ADM-SEC-1).
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            'recovery_email' => ['required', 'string', 'email', 'max:255', Rule::notIn([mb_strtolower($user->email)])],
            'password' => ['required', 'string', 'current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recovery_email.required' => 'L’email de récupération est obligatoire.',
            'recovery_email.email' => 'Veuillez saisir une adresse email valide.',
            'recovery_email.max' => 'L’adresse email ne peut pas dépasser 255 caractères.',
            'recovery_email.not_in' => 'L’email de récupération doit être différent de l’adresse de connexion.',
            'password.required' => 'Le mot de passe actuel est obligatoire.',
            'password.current_password' => 'Le mot de passe est incorrect.',
        ];
    }

    /**
     * Lowercase the address before the checks, as `LoginEmailRequest` does, so a change of case is not a new address.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('recovery_email'))) {
            $this->merge(['recovery_email' => mb_strtolower(trim($this->input('recovery_email')))]);
        }
    }
}
