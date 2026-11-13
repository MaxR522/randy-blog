<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;

const GeminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent';

beforeEach(function () {
    config(['services.gemini.key' => 'cle-gemini', 'services.gemini.model' => 'gemini-test']);
    $this->author = User::factory()->create();
});

/**
 * A Gemini answer whose text is the given JSON value.
 *
 * @return array<string, mixed>
 */
function geminiAnswer(mixed $json, string $finishReason = 'STOP'): array
{
    return ['candidates' => [[
        'content' => ['role' => 'model', 'parts' => [['text' => is_string($json) ? $json : json_encode($json)]]],
        'finishReason' => $finishReason,
    ]]];
}

function suggest(mixed $test, array $payload = []): TestResponse
{
    return $test->actingAs($test->author)->postJson(route('admin.articles.suggestions'), [
        'title' => 'Le taxi-be, parlement roulant',
        'lead_paragraph' => '<p>Quinze places, vingt passagers.</p>',
        'content' => '<p>Le taxi-be démarre quand il est plein.</p>',
        ...$payload,
    ]);
}

test('ADM-COM-8 guests get a 404 and Gemini is not called', function () {
    Http::fake();

    $this->postJson(route('admin.articles.suggestions'), ['title' => 'Titre', 'content' => '<p>Texte</p>'])->assertNotFound();

    Http::assertNothingSent();
});

test('ADM-ART-27 Gemini proposes the description and the keywords from the plain text of the article', function () {
    Http::fake([GeminiEndpoint => Http::response(geminiAnswer([
        'description' => 'Chronique d’un taxi-be d’Antananarivo, où chaque trajet devient un petit parlement.',
        'keywords' => ['taxi-be', 'Antananarivo', 'société'],
    ]))]);

    suggest($this)
        ->assertOk()
        ->assertExactJson([
            'description' => 'Chronique d’un taxi-be d’Antananarivo, où chaque trajet devient un petit parlement.',
            'keywords' => 'taxi-be, Antananarivo, société',
        ]);

    Http::assertSent(fn (Request $request) => $request->url() === GeminiEndpoint
        && $request->hasHeader('x-goog-api-key', 'cle-gemini')
        && $request['contents'][0]['parts'][0]['text'] === "Titre : Le taxi-be, parlement roulant\n\nChapô : Quinze places, vingt passagers.\n\nTexte : Le taxi-be démarre quand il est plein."
        && $request['generationConfig']['responseMimeType'] === 'application/json');
});

test('ADM-ART-26 a description over 160 characters is cut at a word, and keywords are cleaned like the editor stores them', function () {
    Http::fake([GeminiEndpoint => Http::response(geminiAnswer([
        'description' => str_repeat('mot ', 50),
        'keywords' => ['  Taxi-be ', 'taxi-be', 'Madagascar, Antananarivo', '', 'a', 'b', 'c', 'd', 'e', 'f'],
    ]))]);

    $response = suggest($this)->assertOk();

    expect($response->json('description'))->toHaveLength(160)->toEndWith('mot…')
        ->and($response->json('keywords'))->toBe('Taxi-be, Madagascar Antananarivo, a, b, c, d, e, f');
});

test('ADM-ART-27 a failed generation gives the author a French message', function (Closure $answer) {
    Http::fake([GeminiEndpoint => $answer()]);

    suggest($this)
        ->assertStatus(502)
        ->assertExactJson(['message' => 'La génération n’a pas abouti. Réessayez dans quelques instants.']);
})->with([
    'free-tier limit reached' => fn () => fn () => Http::response(['error' => ['message' => 'Quota exceeded']], 429),
    'server error' => fn () => fn () => Http::response([], 500),
    'blocked answer' => fn () => fn () => Http::response(geminiAnswer('', 'SAFETY')),
    'cut answer' => fn () => fn () => Http::response(geminiAnswer('{"description": "Chron', 'MAX_TOKENS')),
    'not JSON' => fn () => fn () => Http::response(geminiAnswer('Voici des mots-clés : taxi-be')),
    'wrong shape' => fn () => fn () => Http::response(geminiAnswer(['description' => 'Texte'])),
    'empty proposal' => fn () => fn () => Http::response(geminiAnswer(['description' => ' ', 'keywords' => []])),
    'unreachable' => fn () => fn () => Http::failedConnection(),
]);

test('ADM-ART-27 without an API key nothing is sent and the author gets the French message', function () {
    config(['services.gemini.key' => null]);
    Http::fake();

    suggest($this)->assertStatus(502);

    Http::assertNothingSent();
});

test('ADM-ART-27 the title and the content are needed before generating', function (array $payload) {
    Http::fake();

    suggest($this, $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([array_key_first($payload) => 'Ajoutez d’abord le titre et le contenu de l’article.']);

    Http::assertNothingSent();
})->with([
    'no title' => [['title' => '']],
    'no content' => [['content' => '']],
    'emptied editor' => [['content' => '<p></p>']],
]);

test('NFR-SEC-4 generation is limited to 10 requests a minute', function () {
    Http::fake([GeminiEndpoint => Http::response(geminiAnswer(['description' => 'Texte', 'keywords' => ['mot']]))]);

    foreach (range(1, 10) as $attempt) {
        suggest($this)->assertOk();
    }

    suggest($this)->assertTooManyRequests();
});
