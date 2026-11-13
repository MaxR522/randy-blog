<?php

use App\Models\User;
use Illuminate\Testing\TestResponse;

beforeEach(function () {
    $this->author = User::factory()->create();
});

/**
 * Send the HTML mammoth makes of a Word document, one block per string.
 *
 * @param  list<string>  $blocks
 */
function importWord(mixed $test, array $blocks): TestResponse
{
    return $test->actingAs($test->author)->postJson(route('admin.articles.import-word'), ['html' => implode('', $blocks)]);
}

test('ADM-COM-8 guests get a 404', function () {
    $this->postJson(route('admin.articles.import-word'), ['html' => '<p>[Titre]</p>'])->assertNotFound();
});

test('ADM-ART-41 a document from the template fills the title, the chapô and the content', function () {
    importWord($this, [
        '<p>Mode d’emploi du modèle : écrivez sous chaque repère.</p>',
        '<p><strong>[Titre]</strong></p>',
        '<p>Le taxi-be, parlement roulant</p>',
        '<p>[ chapo ]</p>',
        '<p>Quinze places, <strong>vingt</strong> passagers.</p>',
        '<p>[Corps]</p>',
        '<p>Le taxi-be démarre quand il est plein.</p>',
        '<h2>Un hémicycle</h2>',
        '<p>[Encadré]</p>',
        '<h4>Les trois règles</h4>',
        '<ul><li>On se pousse.</li></ul>',
        '<p>[Fin encadré]</p>',
        '<p>Suite du texte.</p>',
    ])
        ->assertOk()
        ->assertExactJson([
            'fields' => [
                'title' => 'Le taxi-be, parlement roulant',
                'lead_paragraph' => '<p>Quinze places, <strong>vingt</strong> passagers.</p>',
                'content' => '<p>Le taxi-be démarre quand il est plein.</p><h2>Un hémicycle</h2>'
                    .'<div class="callout-box" role="note"><h4>Les trois règles</h4><ul><li>On se pousse.</li></ul></div>'
                    .'<p>Suite du texte.</p>',
            ],
            'errors' => [],
            'warnings' => [],
            'summary' => ['leadParagraphs' => 1, 'words' => 19, 'headings' => 2, 'callouts' => 1],
        ]);
});

test('ADM-ART-41 the chapô keeps only bold, italic and links, and the content goes through the sanitizer', function () {
    $response = importWord($this, [
        '<p>[Titre]</p>', '<p>Titre</p>',
        '<p>[Chapô]</p>', '<h2>Un <em>chapô</em> <a href="https://example.com">lié</a></h2>',
        '<p>[Corps]</p>', '<p style="color:red">Texte</p><script>alert(1)</script><h1>Intertitre</h1>',
    ])->assertOk();

    expect($response->json('fields.lead_paragraph'))->toBe('Un <em>chapô</em> <a href="https://example.com">lié</a>')
        ->and($response->json('fields.content'))->toBe('<p>Texte</p><h2>Intertitre</h2>');
});

test('ADM-ART-41 images are dropped with a warning that counts them, and a paragraph left empty goes too', function () {
    importWord($this, [
        '<p>[Titre]</p>', '<p>Titre</p>',
        '<p>[Chapô]</p>', '<p>Chapô</p>',
        '<p>[Corps]</p>', '<p>Texte <img src="" /></p>', '<p><img src="" /><img src="" /></p>', '<img src="" />',
    ])
        ->assertOk()
        ->assertJsonPath('fields.content', '<p>Texte </p>')
        ->assertJsonPath('errors', [])
        ->assertJsonPath('warnings', ['Le document contient 4 images : elles ne sont pas importées, ajoutez-les dans l’éditeur.']);
});

test('ADM-ART-41 an empty or missing chapô is only a warning', function (array $leadParagraph) {
    importWord($this, ['<p>[Titre]</p>', '<p>Titre</p>', ...$leadParagraph, '<p>[Corps]</p>', '<p>Texte</p>'])
        ->assertOk()
        ->assertJsonPath('errors', [])
        ->assertJsonPath('warnings', ['Le chapô est vide : ajoutez-le sous le repère [Chapô], ou rédigez-le dans l’éditeur.']);
})->with([
    'missing' => [[]],
    'empty' => [['<p>[Chapô]</p>']],
]);

test('ADM-ART-43 a document that breaks the template is refused with a French reason for each problem', function (array $blocks, array $errors) {
    importWord($this, $blocks)->assertOk()->assertJsonPath('errors', $errors);
})->with([
    'no title marker' => [
        ['<p>[Corps]</p>', '<p>Texte</p>'],
        ['Le repère [Titre] est introuvable : le titre de l’article doit le suivre.'],
    ],
    'no body marker' => [
        ['<p>[Titre]</p>', '<p>Titre</p>'],
        ['Le repère [Corps] est introuvable : le texte de l’article doit le suivre.'],
    ],
    'empty title' => [
        ['<p>[Titre]</p>', '<p>[Corps]</p>', '<p>Texte</p>'],
        ['Le titre est vide : écrivez-le sous le repère [Titre].'],
    ],
    'title on two paragraphs' => [
        ['<p>[Titre]</p>', '<p>Le taxi-be</p>', '<p>parlement roulant</p>', '<p>[Corps]</p>', '<p>Texte</p>'],
        ['Le titre doit tenir en un seul paragraphe.'],
    ],
    'title too long' => [
        ['<p>[Titre]</p>', '<p>'.str_repeat('a', 256).'</p>', '<p>[Corps]</p>', '<p>Texte</p>'],
        ['Le titre ne peut pas dépasser 255 caractères.'],
    ],
    'empty body' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>'],
        ['Le texte de l’article est vide : écrivez-le sous le repère [Corps].'],
    ],
    'marker twice' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>Texte</p>', '<p>[Corps]</p>', '<p>Suite</p>'],
        ['Le repère [Corps] apparaît plusieurs fois : gardez-en un seul.'],
    ],
    'unknown marker' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>Texte</p>', '<p>[Encadre fin]</p>'],
        ['Repère inconnu : [Encadre fin]. Repères acceptés : [Titre], [Chapô], [Corps], [Encadré], [Fin encadré].'],
    ],
    'callout never closed' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>Texte</p>', '<p>[Encadré]</p>', '<p>Les trois règles du taxi-be, à connaître par cœur</p>'],
        ['L’encadré qui commence par « Les trois règles du taxi-be, à connaître… » n’est pas fermé : ajoutez [Fin encadré] à sa fin.'],
    ],
    'callout cut by a section' => [
        ['<p>[Corps]</p>', '<p>Texte</p>', '<p>[Encadré]</p>', '<p>[Titre]</p>', '<p>Titre</p>'],
        ['Un encadré n’est pas fermé : ajoutez [Fin encadré] à sa fin.'],
    ],
    'callout outside the body' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Encadré]</p>', '<p>[Corps]</p>', '<p>Texte</p>'],
        ['Le repère [Encadré] doit se trouver après [Corps], dans le texte de l’article.'],
    ],
    'callout end without start' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>Texte</p>', '<p>[Fin encadré]</p>'],
        ['Le repère [Fin encadré] n’a pas de repère [Encadré] avant lui.'],
    ],
    'callout inside a callout' => [
        ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>[Encadré]</p>', '<p>[Encadré]</p>', '<p>Texte</p>', '<p>[Fin encadré]</p>'],
        ['Un encadré n’est pas fermé : ajoutez [Fin encadré] à sa fin.'],
    ],
]);

test('a bracketed word inside a sentence stays content', function () {
    importWord($this, ['<p>[Titre]</p>', '<p>Titre</p>', '<p>[Corps]</p>', '<p>Il a dit [sic] deux fois.</p>'])
        ->assertOk()
        ->assertJsonPath('errors', [])
        ->assertJsonPath('fields.content', '<p>Il a dit [sic] deux fois.</p>');
});

test('ADM-ART-43 an empty or oversized document is a validation error', function (string $html, string $message) {
    $this->actingAs($this->author)
        ->postJson(route('admin.articles.import-word'), ['html' => $html])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['html' => $message]);
})->with([
    'empty' => ['', 'Le document est vide.'],
    'too long' => [str_repeat('a', 2_000_001), 'Le document est trop long pour être importé.'],
]);
