<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class WordImportRequest extends FormRequest
{
    /**
     * The HTML that mammoth made of the Word document in the browser (ADM-ART-40). Images arrive without their data,
     * so 2 million characters leave room for a very long article.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'html' => ['required', 'string', 'max:2000000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'html.required' => 'Le document est vide.',
            'html.string' => 'Le fichier n’a pas pu être importé. Vérifiez qu’il s’agit bien d’un document Word (.docx).',
            'html.max' => 'Le document est trop long pour être importé.',
        ];
    }
}
