import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusBadgeVariant =
    | 'neutral'
    | 'ok'
    | 'muted'
    | 'info'
    | 'warn'
    | 'bad';

const variantClasses: Record<StatusBadgeVariant, string> = {
    neutral: 'border-grey-medium text-primary bg-white',
    ok: 'border-green-600 bg-green-50 text-green-700',
    muted: 'border-grey-light bg-grey-subtle text-grey-dark',
    info: 'border-accent-200 bg-accent-50 text-accent-700',
    warn: 'border-yellow-600 bg-yellow-50 text-yellow-800',
    bad: 'border-red-600 bg-red-50 text-red-700',
};

type StatusBadgeProps = {
    variant: StatusBadgeVariant;
    className?: string;
    children: ReactNode;
};

/**
 * The label carries the meaning; the colour only reinforces it.
 */
export function StatusBadge({
    variant,
    className,
    children,
}: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-sm border px-2 text-xs font-semibold whitespace-nowrap',
                variantClasses[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
