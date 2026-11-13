<?php

namespace App\Support;

use Dom\Element;
use Dom\HTMLDocument;
use Illuminate\Support\Str;

/**
 * Reads the HTML that mammoth makes of a Word document written from the article template (ADM-ART-40…43).
 *
 * The template splits the document with markers, each alone on its paragraph: `[Titre]`, `[Chapô]` and `[Corps]`
 * open a section that runs until the next one, and `[Encadré]` … `[Fin encadré]` wrap an Encadré inside the body.
 * Text before the first marker is the template's own instructions and is ignored. Images are never imported:
 * the author adds them in the editor.
 *
 * @phpstan-type ImportResult array{
 *     fields: array{title: string, lead_paragraph: string, content: string},
 *     errors: list<string>,
 *     warnings: list<string>,
 *     summary: array{leadParagraphs: int, words: int, headings: int, callouts: int},
 * }
 */
class WordImport
{
    private const string Title = 'titre';

    private const string LeadParagraph = 'chapo';

    private const string Body = 'corps';

    private const string CalloutStart = 'encadre';

    private const string CalloutEnd = 'fin encadre';

    /**
     * Each marker as the author writes it, by its normalized name.
     *
     * @var array<string, string>
     */
    private const array MarkerLabels = [
        self::Title => '[Titre]',
        self::LeadParagraph => '[Chapô]',
        self::Body => '[Corps]',
        self::CalloutStart => '[Encadré]',
        self::CalloutEnd => '[Fin encadré]',
    ];

    private const int TitleMaxLength = 255;

    private const int ExcerptLength = 40;

    /**
     * Elements the chapô keeps, as its editor does (bold, italic, link).
     */
    private const string LeadParagraphTags = '<p><br><strong><b><em><i><a>';

    /** @var list<string> */
    private array $errors = [];

    /**
     * Blocks of each section, as HTML.
     *
     * @var array<string, list<string>>
     */
    private array $sections = [];

    /** @var list<string>|null */
    private ?array $openCallout = null;

    private ?string $currentSection = null;

    private int $callouts = 0;

    private int $images = 0;

    /**
     * @return ImportResult
     */
    public static function read(string $html): array
    {
        return (new self)->parse($html);
    }

    /**
     * @return ImportResult
     */
    private function parse(string $html): array
    {
        $document = HTMLDocument::createFromString('<!DOCTYPE html><html><body>'.$html.'</body></html>', LIBXML_NOERROR);

        foreach (iterator_to_array($document->body->children ?? []) as $block) {
            if ($this->withoutImages($block)) {
                continue;
            }

            $marker = $this->markerOf($block);

            $marker === null ? $this->addBlock($block) : $this->openMarker(...$marker);
        }

        if ($this->openCallout !== null) {
            $this->errors[] = $this->unclosedCalloutError();
        }

        $title = $this->title();
        $leadParagraph = $this->leadParagraph();
        $content = $this->content();

        return [
            'fields' => ['title' => $title, 'lead_paragraph' => $leadParagraph, 'content' => $content],
            'errors' => $this->errors,
            'warnings' => $this->warnings($leadParagraph),
            'summary' => [
                'leadParagraphs' => substr_count($leadParagraph, '<p'),
                'words' => (int) preg_match_all('/[\p{L}\p{N}]+/u', ArticleHtml::plainText($content)),
                'headings' => (int) preg_match_all('/<h[2-4][\s>]/', $content),
                'callouts' => $this->callouts,
            ],
        ];
    }

    /**
     * Count and remove the block's images. Returns true when nothing is left of the block, which is then skipped:
     * a picture alone on its paragraph would otherwise leave an empty paragraph in the article.
     */
    private function withoutImages(Element $block): bool
    {
        $images = $block->localName === 'img' ? [$block] : iterator_to_array($block->getElementsByTagName('img'));

        if ($images === []) {
            return false;
        }

        $this->images += count($images);

        foreach ($images as $image) {
            $image->remove();
        }

        return $block->localName === 'img'
            || (trim($block->textContent ?? '') === '' && $block->querySelector('iframe, video, table, hr') === null);
    }

    /**
     * A marker paragraph's normalized name (`[ Chapô ]` → `chapo`) and its text as written, or null for content.
     * Any short bracketed text alone on its paragraph counts as a marker, so a typo is reported rather than imported.
     *
     * @return array{name: string, written: string}|null
     */
    private function markerOf(Element $block): ?array
    {
        $text = Str::squish($block->textContent ?? '');

        if ($block->localName !== 'p' || preg_match('/^\[([^\[\]]{1,40})]$/u', $text, $match) !== 1) {
            return null;
        }

        return ['name' => Str::of($match[1])->ascii()->lower()->squish()->toString(), 'written' => $text];
    }

    private function openMarker(string $name, string $written): void
    {
        match ($name) {
            self::CalloutStart => $this->openCallout(),
            self::CalloutEnd => $this->closeCallout(),
            self::Title, self::LeadParagraph, self::Body => $this->openSection($name),
            default => $this->reportUnknownMarker($written),
        };
    }

    private function reportUnknownMarker(string $written): void
    {
        $this->errors[] = 'Repère inconnu : '.$written.'. Repères acceptés : '.implode(', ', self::MarkerLabels).'.';
    }

    private function openSection(string $section): void
    {
        if ($this->openCallout !== null) {
            $this->errors[] = $this->unclosedCalloutError();
            $this->openCallout = null;
        }

        if (array_key_exists($section, $this->sections)) {
            $this->errors[] = 'Le repère '.self::MarkerLabels[$section].' apparaît plusieurs fois : gardez-en un seul.';
        }

        $this->sections[$section] ??= [];
        $this->currentSection = $section;
    }

    private function openCallout(): void
    {
        if ($this->currentSection !== self::Body) {
            $this->errors[] = 'Le repère [Encadré] doit se trouver après [Corps], dans le texte de l’article.';

            return;
        }

        if ($this->openCallout !== null) {
            $this->errors[] = $this->unclosedCalloutError();
        }

        $this->openCallout = [];
    }

    private function closeCallout(): void
    {
        if ($this->openCallout === null) {
            $this->errors[] = 'Le repère [Fin encadré] n’a pas de repère [Encadré] avant lui.';

            return;
        }

        $this->sections[self::Body][] = '<div class="callout-box" role="note">'.implode('', $this->openCallout).'</div>';
        $this->openCallout = null;
        $this->callouts++;
    }

    private function addBlock(Element $block): void
    {
        if ($this->currentSection === null) {
            return;
        }

        if ($this->openCallout !== null) {
            $this->openCallout[] = $block->outerHTML;

            return;
        }

        $this->sections[$this->currentSection][] = $block->outerHTML;
    }

    private function unclosedCalloutError(): string
    {
        $excerpt = Str::limit(ArticleHtml::plainText(implode(' ', $this->openCallout ?? [])), self::ExcerptLength, '…');

        return $excerpt === ''
            ? 'Un encadré n’est pas fermé : ajoutez [Fin encadré] à sa fin.'
            : 'L’encadré qui commence par « '.$excerpt.' » n’est pas fermé : ajoutez [Fin encadré] à sa fin.';
    }

    private function title(): string
    {
        if (! array_key_exists(self::Title, $this->sections)) {
            $this->errors[] = 'Le repère [Titre] est introuvable : le titre de l’article doit le suivre.';

            return '';
        }

        $paragraphs = array_values(array_filter(
            array_map(ArticleHtml::plainText(...), $this->sections[self::Title]),
            fn (string $text): bool => $text !== '',
        ));

        if ($paragraphs === []) {
            $this->errors[] = 'Le titre est vide : écrivez-le sous le repère [Titre].';

            return '';
        }

        if (count($paragraphs) > 1) {
            $this->errors[] = 'Le titre doit tenir en un seul paragraphe.';
        }

        if (mb_strlen($paragraphs[0]) > self::TitleMaxLength) {
            $this->errors[] = 'Le titre ne peut pas dépasser 255 caractères.';
        }

        return $paragraphs[0];
    }

    private function leadParagraph(): string
    {
        $html = ArticleHtml::clean(implode('', $this->sections[self::LeadParagraph] ?? []));

        return trim(strip_tags($html, self::LeadParagraphTags));
    }

    private function content(): string
    {
        if (! array_key_exists(self::Body, $this->sections)) {
            $this->errors[] = 'Le repère [Corps] est introuvable : le texte de l’article doit le suivre.';

            return '';
        }

        $content = ArticleHtml::clean(implode('', $this->sections[self::Body]));

        if (ArticleHtml::plainText($content) === '') {
            $this->errors[] = 'Le texte de l’article est vide : écrivez-le sous le repère [Corps].';
        }

        return $content;
    }

    /**
     * @return list<string>
     */
    private function warnings(string $leadParagraph): array
    {
        $warnings = [];

        if ($this->images > 0) {
            $warnings[] = $this->images === 1
                ? 'Le document contient 1 image : elle n’est pas importée, ajoutez-la dans l’éditeur.'
                : "Le document contient {$this->images} images : elles ne sont pas importées, ajoutez-les dans l’éditeur.";
        }

        if (ArticleHtml::plainText($leadParagraph) === '') {
            $warnings[] = 'Le chapô est vide : ajoutez-le sous le repère [Chapô], ou rédigez-le dans l’éditeur.';
        }

        return $warnings;
    }
}
