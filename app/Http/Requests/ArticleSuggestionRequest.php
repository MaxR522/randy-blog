<?php

namespace App\Http\Requests;

use App\Support\ArticleHtml;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ArticleSuggestionRequest extends FormRequest
{
    /**
     * The editor's current text, saved or not (« Générer avec l’IA »). The title and the content are needed for a
     * proposal worth reading; the chapô helps when it is there.
     *
     * @return array<string, array<int, ValidationRule|Closure|string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'lead_paragraph' => ['nullable', 'string', 'max:20000'],
            'content' => ['required', 'string', 'max:2000000', $this->hasText(...)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Ajoutez d’abord le titre et le contenu de l’article.',
            'content.required' => 'Ajoutez d’abord le titre et le contenu de l’article.',
        ];
    }

    /**
     * TinyMCE leaves `<p></p>` in an emptied editor.
     *
     * @param  Closure(string): mixed  $fail
     */
    private function hasText(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ArticleHtml::plainText($value) === '') {
            $fail('Ajoutez d’abord le titre et le contenu de l’article.');
        }
    }
}
