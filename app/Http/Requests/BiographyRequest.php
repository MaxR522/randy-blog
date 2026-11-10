<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BiographyRequest extends FormRequest
{
    /**
     * The biography, rich text from the minimal TinyMCE (ADM-ACC-3). It may be emptied.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:20000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'bio.max' => 'La biographie est trop longue.',
        ];
    }
}
