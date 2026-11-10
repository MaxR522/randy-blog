<?php

namespace App\Http\Requests;

use App\ArticleStatus;
use App\Models\Article;
use App\Support\ArticleHtml;
use App\Support\ArticleSlug;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\In;

class ArticleRequest extends FormRequest
{
    /**
     * Fields of the editor (ADM-ART-20…27). A draft needs only its title (ADM-ART-29, Q8); publishing, or saving an
     * article visitors can read, needs every field.
     *
     * @return array<string, array<int, ValidationRule|Closure|Exists|In|string>>
     */
    public function rules(): array
    {
        $isComplete = $this->mustBeComplete();
        $required = $isComplete ? 'required' : 'nullable';

        return [
            'intent' => ['required', Rule::in(['save', 'publish'])],
            'title' => ['required', 'string', 'max:255'],
            'lead_paragraph' => [$required, 'nullable', 'string', ...($isComplete ? [$this->hasText(...)] : [])],
            'cover' => [
                $isComplete && ! $this->keepsCurrentCover() ? 'required' : 'nullable',
                'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240',
            ],
            'remove_cover' => ['boolean'],
            'cover_photo_credit' => [$required, 'nullable', 'string', 'max:255'],
            'content' => [$required, 'nullable', 'string', ...($isComplete ? [$this->hasText(...)] : [])],
            'category_ids' => ['array', ...($isComplete ? [$this->hasCategory(...)] : [])],
            'category_ids.*' => ['integer', Rule::exists('categories', 'id')->withoutTrashed()],
            'new_categories' => ['array'],
            'new_categories.*' => ['string', 'max:50'],
            'description' => [$required, 'nullable', 'string', 'max:160'],
            'keywords' => [$required, 'nullable', 'string'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $this->slugIsFree(...)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Le titre est obligatoire.',
            'title.max' => 'Le titre ne peut pas dépasser 255 caractères.',
            'lead_paragraph.required' => 'Le chapô est obligatoire.',
            'cover.required' => 'L’image de couverture est obligatoire.',
            'cover.file' => 'L’image n’a pas pu être envoyée.',
            'cover.image' => 'Le fichier doit être une image JPG, PNG ou WebP.',
            'cover.mimes' => 'Le fichier doit être une image JPG, PNG ou WebP.',
            'cover.max' => 'L’image ne doit pas dépasser 10 Mo.',
            'cover_photo_credit.required' => 'Le crédit photo est obligatoire.',
            'cover_photo_credit.max' => 'Le crédit photo ne peut pas dépasser 255 caractères.',
            'content.required' => 'Le contenu est obligatoire.',
            'category_ids.*.exists' => 'Une des catégories choisies n’existe plus.',
            'new_categories.*.max' => 'Le nom d’une catégorie ne peut pas dépasser 50 caractères.',
            'description.required' => 'La description SEO est obligatoire.',
            'description.max' => 'La description SEO ne peut pas dépasser 160 caractères.',
            'keywords.required' => 'Les mots-clés sont obligatoires.',
            'slug.max' => 'L’URL ne peut pas dépasser 255 caractères.',
            'slug.regex' => 'L’URL ne peut contenir que des lettres minuscules sans accents, des chiffres et des tirets.',
        ];
    }

    /**
     * Trim the text fields, and store keywords trimmed, deduplicated and comma separated (ADM-ART-27).
     */
    protected function prepareForValidation(): void
    {
        $keywords = collect(explode(',', $this->string('keywords')->toString()))
            ->map(fn (string $keyword): string => Str::squish($keyword))
            ->filter()
            ->unique(fn (string $keyword): string => Str::lower($keyword))
            ->implode(', ');

        $this->merge([
            'title' => Str::squish($this->string('title')->toString()),
            'cover_photo_credit' => Str::squish($this->string('cover_photo_credit')->toString()) ?: null,
            'description' => Str::squish($this->string('description')->toString()) ?: null,
            'keywords' => $keywords ?: null,
            'slug' => Str::squish($this->string('slug')->toString()) ?: null,
            // Form data drops empty arrays: an article without categories sends no key at all.
            'category_ids' => $this->input('category_ids', []),
            'new_categories' => collect((array) $this->input('new_categories', []))
                ->filter(fn (mixed $name): bool => is_string($name))
                ->map(fn (string $name): string => Str::squish($name))
                ->filter()
                ->values()
                ->all(),
        ]);
    }

    /**
     * Whether the article leaves this request published: « Publier », or any save of a published article.
     */
    public function mustBeComplete(): bool
    {
        return $this->input('intent') === 'publish'
            || $this->editedArticle()?->status === ArticleStatus::Published;
    }

    public function wantsToPublish(): bool
    {
        return $this->input('intent') === 'publish';
    }

    public function editedArticle(): ?Article
    {
        $article = $this->route('article');

        return $article instanceof Article ? $article : null;
    }

    private function keepsCurrentCover(): bool
    {
        return $this->editedArticle()?->cover_photo !== null && ! $this->boolean('remove_cover');
    }

    /**
     * Rich text counts as filled only with visible text: TinyMCE leaves `<p></p>` in an emptied editor.
     *
     * @param  Closure(string): mixed  $fail
     */
    private function hasText(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ArticleHtml::plainText($value) === '') {
            $fail($attribute === 'content' ? 'Le contenu est obligatoire.' : 'Le chapô est obligatoire.');
        }
    }

    /**
     * At least one category, chosen or created inline.
     *
     * @param  Closure(string): mixed  $fail
     */
    private function hasCategory(string $attribute, mixed $value, Closure $fail): void
    {
        if (count((array) $value) + count((array) $this->input('new_categories', [])) === 0) {
            $fail('Choisissez au moins une catégorie.');
        }
    }

    /**
     * @param  Closure(string): mixed  $fail
     */
    private function slugIsFree(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && ArticleSlug::isTaken($value, $this->editedArticle()?->id)) {
            $fail('Cette URL est déjà utilisée par un autre article.');
        }
    }
}
