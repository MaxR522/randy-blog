import { useHttp } from '@inertiajs/react';
import { CircleAlert, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { suggestions } from '@/routes/admin/articles';
import type { ArticleSuggestions } from '@/types/admin';

const text = adminLabels.suggestions;

type SeoSuggestionsProps = {
    title: string;
    leadParagraph: string;
    content: string;
    /** Whether the content has visible words, so a request is worth sending. */
    hasContent: boolean;
    /** Whether the description or the keywords already hold text, which the proposal replaces. */
    hasCurrentValues: boolean;
    onSuggest: (suggestions: ArticleSuggestions) => void;
};

/**
 * « Générer avec l’IA »: Gemini proposes the SEO description and the keywords from the editor's current text.
 * Nothing is saved; filled fields are replaced only after a confirmation.
 */
export function SeoSuggestions({
    title,
    leadParagraph,
    content,
    hasContent,
    hasCurrentValues,
    onSuggest,
}: SeoSuggestionsProps) {
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const isMissingText = title.trim() === '' || !hasContent;
    // « Ajoutez d’abord… » disappears as soon as the text is there, for example right after a Word import.
    const shownError =
        error === text.missingText && !isMissingText ? null : error;
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

    return (
        <div className="flex flex-col gap-2">
            <Button
                variant="secondary"
                isLoading={http.processing}
                disabled={http.processing}
                onClick={start}
                className="self-start text-sm"
            >
                {!http.processing && (
                    <WandSparkles
                        aria-hidden="true"
                        className="size-4.5"
                        strokeWidth={1.75}
                    />
                )}
                {text.generate}
            </Button>
            {shownError ? (
                <p
                    role="alert"
                    className="text-body-small flex gap-2 font-medium text-red-700"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-0.5 size-4 flex-none"
                        strokeWidth={2}
                    />
                    {shownError}
                </p>
            ) : (
                <p className="text-caption text-grey-dark">{text.help}</p>
            )}

            <ConfirmModal
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={generate}
                title={text.replaceTitle}
                description={text.replaceDescription}
                confirmLabel={text.replace}
                confirmVariant="primary"
            />
        </div>
    );
}
