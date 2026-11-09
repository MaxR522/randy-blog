import { usePage } from '@inertiajs/react';
import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SUCCESS_MILLISECONDS = 4000;
const ERROR_MILLISECONDS = 8000;

type Toast = {
    id: number;
    variant: 'success' | 'error';
    message: string;
};

const toastMotion =
    'transition duration-(--duration-slow) ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none';

/**
 * Shows the flash message of the last action (ADM-COM-6), at the bottom of the viewport.
 * Both live regions stay mounted so screen readers announce what arrives in them, and the
 * key replaces the node so that the same message twice in a row is announced twice.
 */
export function FlashToasts() {
    const { flash } = usePage();
    const [toast, setToast] = useState<Toast | null>(null);
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
        });
    }, [flash]);

    // Tied to the toast, not to `flash`: any later visit brings an empty `flash`, which must not cancel the hiding.
    useEffect(() => {
        if (!toast) {
            return;
        }

        const timeout = window.setTimeout(
            () => setToast(null),
            toast.variant === 'error'
                ? ERROR_MILLISECONDS
                : SUCCESS_MILLISECONDS,
        );

        return () => window.clearTimeout(timeout);
    }, [toast]);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
            <div role="status">
                {toast?.variant === 'success' && (
                    <div
                        key={toast.id}
                        className={`bg-primary text-body-small inline-flex min-h-12 items-center gap-2.5 rounded-lg px-4 py-2 font-medium text-white ${toastMotion}`}
                    >
                        <Check
                            aria-hidden="true"
                            className="size-4.5 flex-none"
                            strokeWidth={2}
                        />
                        {toast.message}
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
