<?php

namespace App\Http\Requests;

use App\Models\Subscription;
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
use Illuminate\Validation\Validator;

/**
 * Fields of the newsletter composer (ADM-SUB-20, ADM-SUB-25), for « Enregistrer le brouillon », « Envoyer un test » and
 * « Envoyer ». A draft needs its subject; a test or a send also needs some content, and a send someone to go to.
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
                $this->needsContent() ? 'required' : 'nullable',
                'nullable',
                'string',
                ...($this->needsContent() ? [$this->hasContent(...)] : []),
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
            'content.required' => $this->contentRequiredMessage(),
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

    /**
     * « Tous les abonnés confirmés » with nobody confirmed: there is no one to send to (a selection is checked above).
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->isSend() && $this->input('audience') === NewsletterAudience::All->value && ! Subscription::query()->confirmed()->exists()) {
                $validator->errors()->add('audience', 'Aucun abonné confirmé à qui envoyer.');
            }
        }];
    }

    private function isTestSend(): bool
    {
        return $this->routeIs('admin.newsletters.test');
    }

    private function isSend(): bool
    {
        return $this->routeIs('admin.newsletters.send', 'admin.newsletters.send-draft');
    }

    private function needsContent(): bool
    {
        return $this->isTestSend() || $this->isSend();
    }

    private function contentRequiredMessage(): string
    {
        return $this->isSend() ? 'Le contenu est obligatoire pour envoyer la newsletter.' : 'Le contenu est obligatoire pour envoyer un test.';
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
            $fail($this->contentRequiredMessage());
        }
    }
}
