import { Link, usePage } from '@inertiajs/react';
import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { create as createNewsletter } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { adminLabels } from '@/lib/labels.admin.fr';

const SUCCESS_MILLISECONDS = 4000;
const ERROR_MILLISECONDS = 8000;
const ACTION_MILLISECONDS = 10000;

type Toast = {
    id: number;
    variant: 'success' | 'error';
    message: string;
    /** « Envoyer par email aux abonnés » after a publication (ADM-SUB-30). */
    publishedArticleId?: number;
};

const toastMotion =
    'transition duration-(--duration-slow) ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none';

/**
 * Shows the flash message of the last action (ADM-COM-6), at the bottom of the viewport. After a publication, the
 * toast offers to send the article to the subscribers (ADM-SUB-30): it then stays longer, and waits while the pointer
 * or the focus is on it (WCAG 2.2.1).
 * Both live regions stay mounted so screen readers announce what arrives in them, and the
 * key replaces the node so that the same message twice in a row is announced twice.
 */
export function FlashToasts() {
    const { flash } = usePage();
    const [toast, setToast] = useState<Toast | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const nextId = useRef(0);

    useEffect(() => {
        const message = flash.error ?? flash.success;

        if (!message) {
            return;
        }

        nextId.current += 1;
        setToast({
            id: nextId.current,
            variant: flash.error ? 'error' : 'success',
            message,
            publishedArticleId: flash.error
                ? undefined
                : flash.publishedArticleId,
        });
        setIsPaused(false);
    }, [flash]);

    // Tied to the toast, not to `flash`: any later visit brings an empty `flash`, which must not cancel the hiding.
    useEffect(() => {
        if (!toast || isPaused) {
            return;
        }

        const timeout = window.setTimeout(
            () => setToast(null),
            toast.variant === 'error'
                ? ERROR_MILLISECONDS
                : toast.publishedArticleId
                  ? ACTION_MILLISECONDS
                  : SUCCESS_MILLISECONDS,
        );

        return () => window.clearTimeout(timeout);
    }, [toast, isPaused]);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
            <div role="status">
                {toast?.variant === 'success' && (
                    <div
                        key={toast.id}
                        onPointerEnter={() => setIsPaused(true)}
                        onPointerLeave={() => setIsPaused(false)}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                        className={`${toast.publishedArticleId !== undefined ? 'pointer-events-auto flex-wrap' : ''} bg-primary text-body-small inline-flex min-h-12 items-center gap-2.5 rounded-lg px-4 py-2 font-medium text-white ${toastMotion}`}
                    >
                        <Check
                            aria-hidden="true"
                            className="size-4.5 flex-none"
                            strokeWidth={2}
                        />
                        {toast.message}
                        {toast.publishedArticleId !== undefined && (
                            <Link
                                href={createNewsletter.url({
                                    query: {
                                        article: toast.publishedArticleId,
                                    },
                                })}
                                onClick={() => setToast(null)}
                                className="pointer-events-auto -my-2 inline-flex min-h-11 items-center underline underline-offset-4"
                            >
                                {adminLabels.articles.sendToSubscribers}
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <div role="alert">
                {toast?.variant === 'error' && (
                    <div
                        key={toast.id}
                        className={`text-body-small inline-flex min-h-12 items-center gap-2.5 rounded-lg border border-red-600 bg-red-50 px-4 py-2 font-medium text-red-700 ${toastMotion}`}
                    >
                        <CircleAlert
                            aria-hidden="true"
                            className="size-4.5 flex-none"
                            strokeWidth={2}
                        />
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}
