import type { PreviewedArticle } from '@/helpers/article';
import type { AutosavedFields } from '@/helpers/article-autosave';
import type { EditorArticle } from '@/types/admin';

export const WORDS_PER_MINUTE = 200;

/**
 * Fields in page order: the first one with an error gets the focus (A11Y-FORM-2).
 */
export const FIELD_ORDER = [
    'title',
    'lead_paragraph',
    'cover',
    'cover_photo_credit',
    'audio',
    'content',
    'category_ids',
    'description',
    'keywords',
    'slug',
] as const;

/**
 * The file fields, which never live in the browser's autosave.
 */
export type EditorFiles = {
    cover: File | null;
    remove_cover: boolean;
    audio: File | null;
    remove_audio: boolean;
};

export type EditorForm = AutosavedFields & EditorFiles;

export type SubmitIntent = 'save' | 'publish';

/**
 * No new file, nothing to remove: the file fields of a freshly loaded article.
 */
export function emptyFiles(): EditorFiles {
    return {
        cover: null,
        remove_cover: false,
        audio: null,
        remove_audio: false,
    };
}

/**
 * Same rule as `ArticleSlug::fromTitle`: lowercase ASCII words joined by hyphens, apostrophes splitting words.
 */
export function slugFromTitle(title: string): string {
    return title
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/œ/gi, 'oe')
        .replace(/æ/gi, 'ae')
        .toLowerCase()
        .replace(/['’]/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Whether the slug no longer follows the title: frozen once published, or written by hand.
 */
export function isSlugCustom(article: EditorArticle | null): boolean {
    return (
        article !== null &&
        (article.isSlugFrozen || article.slug !== slugFromTitle(article.title))
    );
}

export function fieldsOf(article: EditorArticle | null): AutosavedFields {
    return {
        title: article?.title ?? '',
        lead_paragraph: article?.leadParagraph ?? '',
        content: article?.content ?? '',
        cover_photo_credit: article?.coverPhotoCredit ?? '',
        category_ids: article?.categoryIds ?? [],
        new_categories: [],
        description: article?.description ?? '',
        keywords: article?.keywords ?? '',
        slug: article?.slug ?? '',
    };
}

/**
 * The saved article as the preview panel shows it, as in the list.
 */
export function previewedArticleOf(article: EditorArticle): PreviewedArticle {
    return {
        id: article.id,
        title: article.title,
        status: article.status,
        previewUrl: article.previewUrl,
    };
}

export function autosavedFields(data: EditorForm): AutosavedFields {
    return {
        title: data.title,
        lead_paragraph: data.lead_paragraph,
        content: data.content,
        cover_photo_credit: data.cover_photo_credit,
        category_ids: data.category_ids,
        new_categories: data.new_categories,
        description: data.description,
        keywords: data.keywords,
        slug: data.slug,
    };
}

/**
 * Words of the chapô and the text, counted like `Article::wordCount` on the server.
 */
export function wordCount(...htmlParts: string[]): number {
    const parser = new DOMParser();
    const plain = htmlParts
        .map(
            (html) =>
                parser.parseFromString(html, 'text/html').body.textContent ??
                '',
        )
        .join(' ');

    return plain.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

/**
 * Reading time in whole minutes, at least one.
 */
export function readingMinutes(words: number): number {
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Keywords are one comma separated list: a line break (Enter, or a pasted one-per-line list) becomes a comma.
 */
export function keywordsFromInput(value: string): string {
    return value.replace(/\s*\n+\s*/g, ', ');
}

/**
 * Scroll to the first field with an error, in page order, and focus it.
 */
export function focusFirstError(
    fieldErrors: Partial<Record<string, string>>,
): void {
    const field = FIELD_ORDER.find((name) => fieldErrors[name]);
    const container = field
        ? document.querySelector<HTMLElement>(`[data-field="${field}"]`)
        : null;

    if (!container) {
        return;
    }

    container.scrollIntoView({ block: 'center' });

    // TinyMCE hides the textarea and edits inside an iframe: focus its body instead.
    const editorBody = container.querySelector('iframe')?.contentDocument?.body;

    if (editorBody) {
        editorBody.focus();

        return;
    }

    container
        .querySelector<HTMLElement>(
            'input:not([type="file"]), textarea, button',
        )
        ?.focus({ preventScroll: true });
}
