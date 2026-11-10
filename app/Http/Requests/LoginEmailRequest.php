<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoginEmailRequest extends FormRequest
{
    /**
     * A new login email, confirmed by the current password (ADM-ACC-4).
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            'email' => ['required', 'string', 'email', 'max:255', Rule::notIn([mb_strtolower($user->email)]), Rule::unique(User::class, 'email')->ignore($user->id)],
            'password' => ['required', 'string', 'current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'La nouvelle adresse email est obligatoire.',
            'email.email' => 'Veuillez saisir une adresse email valide.',
            'email.max' => 'L’adresse email ne peut pas dépasser 255 caractères.',
            'email.not_in' => 'C’est déjà votre adresse de connexion.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe actuel est obligatoire.',
            'password.current_password' => 'Le mot de passe est incorrect.',
        ];
    }

    /**
     * Lowercase the address before the checks, as the login form does (Fortify `lowercase_usernames`), so a
     * change of case alone is neither a new address nor a duplicate.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }
}
