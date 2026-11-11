<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RecoveryPhoneRequest extends FormRequest
{
    /**
     * The recovery phone in international format, stored only (ADM-SEC-2, Q6), confirmed by the current password.
     * An empty field removes it.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'recovery_phone' => ['nullable', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
            'password' => ['required', 'string', 'current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recovery_phone.regex' => 'Saisissez le numéro au format international, par exemple +261 34 00 000 00.',
            'password.required' => 'Le mot de passe actuel est obligatoire.',
            'password.current_password' => 'Le mot de passe est incorrect.',
        ];
    }

    /**
     * Keep only the leading « + » and the digits, so « +261 34 00 000 00 » is stored as « +261340000000 » (E.164).
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('recovery_phone'))) {
            $phone = preg_replace('/[\s.\-()]/u', '', $this->input('recovery_phone'));

            $this->merge(['recovery_phone' => $phone === '' ? null : $phone]);
        }
    }
}
