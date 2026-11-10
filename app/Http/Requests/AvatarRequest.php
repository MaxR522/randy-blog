<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AvatarRequest extends FormRequest
{
    /**
     * The avatar, already cropped square in the browser, and its credit (ADM-ACC-1). Without a file, only the
     * credit changes.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'avatar_credit' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.file' => 'L’image n’a pas pu être envoyée.',
            'avatar.image' => 'Le fichier doit être une image JPG, PNG ou WebP.',
            'avatar.mimes' => 'Le fichier doit être une image JPG, PNG ou WebP.',
            'avatar.max' => 'L’image ne doit pas dépasser 2 Mo.',
            'avatar_credit.max' => 'Le crédit photo ne peut pas dépasser 255 caractères.',
        ];
    }
}
