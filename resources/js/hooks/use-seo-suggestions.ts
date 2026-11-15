import { useHttp } from '@inertiajs/react';
import { useState } from 'react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { suggestions } from '@/routes/admin/articles';
import type { ArticleSuggestions } from '@/types/admin';

const text = adminLabels.suggestions;

type SeoSuggestionsInput = {
    title: string;
    leadParagraph: string;
    content: string;
    /** Whether the content has visible words, so a request is worth sending. */
    hasContent: boolean;
    /** Whether the description or the keywords already hold text, which the proposal replaces. */
    hasCurrentValues: boolean;
};

/**
 * « Générer avec l’IA »: asks Gemini for the SEO description and keywords of the editor's current text.
 * Nothing is saved; filled fields are replaced only after a confirmation.
 */
export function useSeoSuggestions(
    {
        title,
        leadParagraph,
        content,
        hasContent,
        hasCurrentValues,
    }: SeoSuggestionsInput,
    onSuggest: (suggestions: ArticleSuggestions) => void,
) {
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const isMissingText = title.trim() === '' || !hasContent;
    const http = useHttp<
        { title: string; lead_paragraph: string; content: string },
        ArticleSuggestions
    >({ title: '', lead_paragraph: '', content: '' });

    function generate(): void {
        setIsConfirming(false);
        setError(null);
        http.transform(() => ({
            title,
            lead_paragraph: leadParagraph,
            content,
        }));
        // The callbacks above handle every outcome; the returned promise only repeats them.
        http.post(suggestions.url(), {
            onSuccess: onSuggest,
            onError: (errors) =>
                setError(errors.title ?? errors.content ?? text.missingText),
            onHttpException: () => {
                setError(text.failed);

                return false;
            },
            onNetworkError: () => {
                setError(text.failed);

                return false;
            },
        }).catch(() => undefined);
    }

    function start(): void {
        if (isMissingText) {
            setError(text.missingText);

            return;
        }

        if (hasCurrentValues) {
            setIsConfirming(true);

            return;
        }

        generate();
    }

    return {
        processing: http.processing,
        // « Ajoutez d’abord… » disappears as soon as the text is there, for example right after a Word import.
        error: error === text.missingText && !isMissingText ? null : error,
        isConfirming,
        start,
        generate,
        cancelConfirm: (): void => setIsConfirming(false),
    };
}

export type SeoSuggestionsState = ReturnType<typeof useSeoSuggestions>;
