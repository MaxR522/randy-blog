<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DisplayNameRequest extends FormRequest
{
    /**
     * The display name, shown at the top of the biography on the author page (ADM-ACC-2).
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'display_name.required' => 'Le nom d’affichage est obligatoire.',
            'display_name.max' => 'Le nom d’affichage ne peut pas dépasser 100 caractères.',
        ];
    }
}
