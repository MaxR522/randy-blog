import { create as createNewsletter } from '@/actions/App/Http/Controllers/Admin/NewsletterController';

export const SUCCESS_MILLISECONDS = 4000;
export const ERROR_MILLISECONDS = 8000;
export const ACTION_MILLISECONDS = 10000;

export type Toast = {
    id: number;
    variant: 'success' | 'error';
    message: string;
    /** « Envoyer par email aux abonnés » after a publication (ADM-SUB-30): the composer with the article. */
    sendUrl?: string;
};

type FlashMessages = {
    success?: string;
    error?: string;
    publishedArticleId?: number;
};

/** The toast for the flash of the last action, or `null` when it carries no message; an error wins. */
export function toastOf(flash: FlashMessages, id: number): Toast | null {
    const message = flash.error ?? flash.success;

    if (!message) {
        return null;
    }

    const articleId = flash.error ? undefined : flash.publishedArticleId;

    return {
        id,
        variant: flash.error ? 'error' : 'success',
        message,
        sendUrl:
            articleId === undefined
                ? undefined
                : createNewsletter.url({ query: { article: articleId } }),
    };
}

/** How long the toast stays: errors and the toast with an action stay longer. */
export function toastDurationOf(toast: Toast): number {
    if (toast.variant === 'error') {
        return ERROR_MILLISECONDS;
    }

    return toast.sendUrl ? ACTION_MILLISECONDS : SUCCESS_MILLISECONDS;
}
