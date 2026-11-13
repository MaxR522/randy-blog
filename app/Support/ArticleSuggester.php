<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Proposes the SEO description and the keywords of an article with Gemini (ADM-ART-26, ADM-ART-27).
 *
 * The free tier is enough for a few calls a day; Google may use the text sent to improve its products, which is
 * accepted since the article is meant to be published. The author always reviews the proposal before saving.
 */
class ArticleSuggester
{
    private const string ApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    private const int TimeoutSeconds = 20;

    private const int DescriptionMaxLength = 160;

    private const int MaxKeywords = 8;

    /**
     * Characters of article text sent: well past a long article, far below the model's context.
     */
    private const int MaxInputLength = 60_000;

    private const string Instructions = <<<'TEXT'
        Tu aides l’auteur d’un blog d’opinion francophone (Madagascar, politique, société, culture) à référencer ses articles.
        À partir de l’article fourni, rédige :
        - « description » : une meta description en français, de 120 à 155 caractères, qui donne envie de lire l’article, sans guillemets, sans emoji, sans le nom de l’auteur ni du site ;
        - « keywords » : 5 à 8 mots-clés ou expressions courtes en français, tirés du sujet réel de l’article, en minuscules sauf pour les noms propres, sans doublons.
        Respecte la typographie française (apostrophe ’, espace avant : ; ! ?).
        TEXT;

    /**
     * @return array{description: string, keywords: string}
     *
     * @throws ArticleSuggestionException
     */
    public function suggest(string $title, string $leadParagraph, string $content): array
    {
        $key = config('services.gemini.key');
        $model = config('services.gemini.model');

        if (! is_string($key) || $key === '' || ! is_string($model) || $model === '') {
            throw new ArticleSuggestionException('Gemini is not configured: set GEMINI_API_KEY.');
        }

        $article = Str::limit(implode("\n\n", [
            'Titre : '.$title,
            'Chapô : '.ArticleHtml::plainText($leadParagraph),
            'Texte : '.ArticleHtml::plainText($content),
        ]), self::MaxInputLength);

        try {
            $response = Http::timeout(self::TimeoutSeconds)
                ->withHeaders(['x-goog-api-key' => $key])
                ->post(self::ApiUrl."/{$model}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => self::Instructions]]],
                    'contents' => [['role' => 'user', 'parts' => [['text' => $article]]]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseJsonSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'description' => ['type' => 'string', 'description' => 'Meta description, 155 caractères au plus.'],
                                'keywords' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => '5 à 8 mots-clés.'],
                            ],
                            'required' => ['description', 'keywords'],
                        ],
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new ArticleSuggestionException('Gemini is unreachable: '.$exception->getMessage(), previous: $exception);
        }

        if ($response->failed()) {
            throw new ArticleSuggestionException("Gemini refused the request ({$response->status()}): ".$response->json('error.message', ''));
        }

        $finishReason = $response->json('candidates.0.finishReason');
        $answer = $response->json('candidates.0.content.parts.0.text');

        if ($finishReason !== 'STOP' || ! is_string($answer)) {
            throw new ArticleSuggestionException('Gemini gave no usable answer (finish reason: '.var_export($finishReason, true).', block reason: '.var_export($response->json('promptFeedback.blockReason'), true).').');
        }

        return $this->normalized(json_decode($answer, true));
    }

    /**
     * Check the answer's shape and bring it to the editor's rules: a description that fits the 160 characters,
     * keywords trimmed, deduplicated and comma separated as `ArticleRequest` stores them.
     *
     * @return array{description: string, keywords: string}
     */
    private function normalized(mixed $answer): array
    {
        if (! is_array($answer) || ! is_string($answer['description'] ?? null) || ! is_array($answer['keywords'] ?? null)) {
            throw new ArticleSuggestionException('Gemini answered JSON of the wrong shape.');
        }

        $description = Str::squish($answer['description']);

        if (mb_strlen($description) > self::DescriptionMaxLength) {
            $description = Str::limit($description, self::DescriptionMaxLength - 1, '…', preserveWords: true);
        }

        $keywords = collect($answer['keywords'])
            ->filter(fn (mixed $keyword): bool => is_string($keyword))
            ->map(fn (string $keyword): string => Str::squish(str_replace(',', ' ', $keyword)))
            ->filter()
            ->unique(fn (string $keyword): string => Str::lower($keyword))
            ->take(self::MaxKeywords)
            ->implode(', ');

        if ($description === '' || $keywords === '') {
            throw new ArticleSuggestionException('Gemini answered an empty description or no keywords.');
        }

        return ['description' => $description, 'keywords' => $keywords];
    }
}
