import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MobileActionBarProps = {
    /** One column for a single button, two otherwise. */
    isSingle: boolean;
    children: ReactNode;
};

/**
 * Bar stuck to the bottom of the screen on mobile, holding the editor's main actions.
 */
export function MobileActionBar({ isSingle, children }: MobileActionBarProps) {
    return (
        <div
            className={cn(
                'tablet:hidden -mx-gutter border-grey-light px-gutter sticky bottom-0 z-10 mt-6 grid gap-2 border-t bg-white py-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.15)]',
                isSingle ? 'grid-cols-1' : 'grid-cols-2',
            )}
        >
            {children}
        </div>
    );
}
