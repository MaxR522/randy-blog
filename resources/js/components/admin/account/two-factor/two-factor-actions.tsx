import type { ReactNode } from 'react';

/**
 * The two buttons under a two-factor step: side by side, full width on phone, right-aligned from tablet.
 */
export function TwoFactorActions({ children }: { children: ReactNode }) {
    return (
        <div className="tablet:flex tablet:justify-end [&>button]:tablet:h-11 grid grid-cols-2 gap-2 [&>button]:h-12">
            {children}
        </div>
    );
}
