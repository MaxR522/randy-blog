<?php

namespace App\Http\Requests;

use App\NewsletterAudience;
use App\Support\ArticleHtml;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Exists;

/**
 * Fields of the newsletter composer (ADM-SUB-20, ADM-SUB-25), for « Enregistrer le brouillon » and « Envoyer un test ».
 * A draft needs its subject; a test also needs some content.
 */
class NewsletterRequest extends FormRequest
{
    public const int SubjectMaxLength = 150;

    public const int PreheaderMaxLength = 150;

    /**
     * @return array<string, array<int, ValidationRule|Closure|Enum|Exists|string>>
     */
    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:'.self::SubjectMaxLength],
            'preheader' => ['nullable', 'string', 'max:'.self::PreheaderMaxLength],
            'content' => [
                $this->isTestSend() ? 'required' : 'nullable',
                'nullable',
                'string',
                ...($this->isTestSend() ? [$this->hasContent(...)] : []),
            ],
            'audience' => ['required', Rule::enum(NewsletterAudience::class)],
            // A test goes to the author only: the recipients do not matter yet.
            'subscription_ids' => ['array', Rule::requiredIf(! $this->isTestSend() && $this->input('audience') === NewsletterAudience::Selection->value)],
            'subscription_ids.*' => [
                'integer',
                Rule::exists('subscriptions', 'id')->where(fn (Builder $query) => $query
                    ->whereNull('deleted_at')
                    ->whereNull('unsubscribed_at')
                    ->where('is_verified', true)),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject.required' => 'L’objet est obligatoire.',
            'subject.max' => 'L’objet ne peut pas dépasser '.self::SubjectMaxLength.' caractères.',
            'preheader.max' => 'Le texte d’aperçu ne peut pas dépasser '.self::PreheaderMaxLength.' caractères.',
            'content.required' => 'Le contenu est obligatoire pour envoyer un test.',
            'subscription_ids.required' => 'Choisissez au moins un abonné.',
            'subscription_ids.*.exists' => 'Un des abonnés choisis n’est plus abonné.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'subject' => Str::squish($this->string('subject')->toString()),
            'preheader' => Str::squish($this->string('preheader')->toString()) ?: null,
            'audience' => $this->input('audience', NewsletterAudience::All->value),
            'subscription_ids' => $this->input('audience') === NewsletterAudience::Selection->value
                ? array_values(array_unique(array_map(intval(...), (array) $this->input('subscription_ids', []))))
                : [],
        ]);
    }

    public function audience(): NewsletterAudience
    {
        return NewsletterAudience::from($this->string('audience')->toString());
    }

    /**
     * @return list<int>
     */
    public function subscriptionIds(): array
    {
        /** @var list<int> $ids */
        $ids = $this->validated('subscription_ids', []);

        return $ids;
    }

    private function isTestSend(): bool
    {
        return $this->routeIs('admin.newsletters.test');
    }

    /**
     * Content counts as filled with visible text or an article card: TinyMCE leaves `<p></p>` in an emptied editor.
     *
     * @param  Closure(string): mixed  $fail
     */
    private function hasContent(string $attribute, mixed $value, Closure $fail): void
    {
        $cleaned = is_string($value) ? ArticleHtml::clean($value, allowArticleCards: true) : '';

        if (ArticleHtml::plainText($cleaned) === '' && ! str_contains($cleaned, ArticleHtml::ArticleCardAttribute) && ! str_contains($cleaned, '<img')) {
            $fail('Le contenu est obligatoire pour envoyer un test.');
        }
    }
}
