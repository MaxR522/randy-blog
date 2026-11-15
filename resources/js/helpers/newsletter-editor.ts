import type { PickedArticle } from '@/helpers/article-picker';
import type { PickedSubscriber } from '@/helpers/subscriber-picker';
import type { AdminNewsletter } from '@/types/admin';

/** Most characters of the subject and of the preheader. */
export const NEWSLETTER_FIELD_MAX_LENGTH = 150;

/** Who receives the newsletter. */
export type NewsletterAudience = 'all' | 'selection';

/** The composer's form, as `NewsletterController` validates it. */
export type NewsletterForm = {
    subject: string;
    preheader: string;
    content: string;
    audience: NewsletterAudience;
    subscription_ids: number[];
};

/** The draft the composer starts from, as `NewsletterController` sends it. */
export type NewsletterDraft = {
    newsletter: AdminNewsletter | null;
    content: string | null;
    selectedSubscribers: PickedSubscriber[];
    /** The article of the publish toast's shortcut (ADM-SUB-30), inserted as a card in a new newsletter. */
    initialArticle: PickedArticle | null;
};

/**
 * The article card inserted in the content (ADM-SUB-21): thumbnail, bold title, chapo and « Lire l’article », then
 * an empty paragraph to keep typing after it. Built with the DOM so the texts are escaped.
 */
export function articleCardHtml(article: PickedArticle): string {
    const card = document.createElement('div');
    card.setAttribute('data-article-card', String(article.id));

    if (article.thumbnail) {
        const image = document.createElement('img');
        image.src = article.thumbnail;
        image.alt = '';
        card.append(image);
    }

    for (const [line, isBold] of [
        [article.title, true],
        [article.chapo, false],
        ['Lire l’article', false],
    ] as const) {
        const paragraph = document.createElement('p');

        if (isBold) {
            const strong = document.createElement('strong');
            strong.textContent = line;
            paragraph.append(strong);
        } else {
            paragraph.textContent = line;
        }

        card.append(paragraph);
    }

    return card.outerHTML + '<p></p>';
}

/**
 * The form's first values: the saved draft, or a new newsletter, with the toast's article as subject and card.
 */
export function newsletterFieldsOf({
    newsletter,
    content,
    selectedSubscribers,
    initialArticle,
}: NewsletterDraft): NewsletterForm {
    return {
        subject: newsletter?.subject ?? initialArticle?.title ?? '',
        preheader: newsletter?.preheader ?? '',
        content:
            content ?? (initialArticle ? articleCardHtml(initialArticle) : ''),
        audience: newsletter?.audience ?? 'all',
        subscription_ids: selectedSubscribers.map(({ id }) => id),
    };
}

/**
 * The first server error about the chosen subscribers (`subscription_ids` or one of its items).
 */
export function selectionErrorOf(
    errors: Partial<Record<string, string>>,
): string | undefined {
    return Object.entries(errors).find(([key]) =>
        key.startsWith('subscription_ids'),
    )?.[1];
}
