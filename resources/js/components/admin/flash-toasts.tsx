import { Link } from '@inertiajs/react';
import { Check, CircleAlert } from 'lucide-react';
import type { FlashToastsState } from '@/hooks/use-flash-toasts';
import { adminLabels } from '@/lib/labels.admin.fr';

const toastMotion =
    'transition duration-(--duration-slow) ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none';

/**
 * Shows the flash message of the last action (ADM-COM-6), from `useFlashToasts`, at the bottom of the viewport. After a publication, the
 * toast offers to send the article to the subscribers (ADM-SUB-30): it then stays longer, and waits while the pointer
 * or the focus is on it (WCAG 2.2.1).
 * Both live regions stay mounted so screen readers announce what arrives in them, and the
 * key replaces the node so that the same message twice in a row is announced twice.
 */
export function FlashToasts({ toasts }: { toasts: FlashToastsState }) {
    const { toast } = toasts;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
            <div role="status">
                {toast?.variant === 'success' && (
                    <div
                        key={toast.id}
                        onPointerEnter={toasts.pause}
                        onPointerLeave={toasts.resume}
                        onFocus={toasts.pause}
                        onBlur={toasts.resume}
                        className={`${toast.sendUrl !== undefined ? 'pointer-events-auto flex-wrap' : ''} bg-primary text-body-small inline-flex min-h-12 items-center gap-2.5 rounded-lg px-4 py-2 font-medium text-white ${toastMotion}`}
                    >
                        <Check
                            aria-hidden="true"
                            className="size-4.5 flex-none"
                            strokeWidth={2}
                        />
                        {toast.message}
                        {toast.sendUrl !== undefined && (
                            <Link
                                href={toast.sendUrl}
                                onClick={toasts.dismiss}
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
