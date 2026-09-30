import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastProps = {
    message: string;
    announcement: string;
    isVisible: boolean;
};

/**
 * Short confirmation at the bottom of the viewport. Stays mounted so its status region is
 * already in the page when the message arrives, which screen readers need to announce it.
 */
export function Toast({ message, announcement, isVisible }: ToastProps) {
    return (
        <div
            role="status"
            className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
        >
            <div
                aria-hidden="true"
                className={cn(
                    'bg-primary text-body inline-flex h-12 items-center gap-2.5 rounded-md px-4.5 font-medium text-white transition duration-(--duration-slow) ease-out motion-reduce:transition-none',
                    isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-2 opacity-0',
                )}
            >
                <Check className="size-4.5" strokeWidth={1.75} />
                {message}
            </div>
            <span className="sr-only">{isVisible ? announcement : ''}</span>
        </div>
    );
}
