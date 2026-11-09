import { Check, CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AlertProps = {
    variant: 'error' | 'success';
    id?: string;
    className?: string;
    children: ReactNode;
};

/**
 * Form-level message: `role="alert"` for an error, `role="status"` for a success.
 */
export function Alert({ variant, id, className, children }: AlertProps) {
    const Icon = variant === 'error' ? CircleAlert : Check;

    return (
        <div
            id={id}
            role={variant === 'error' ? 'alert' : 'status'}
            className={cn(
                'text-body-small flex gap-2.5 rounded-md border px-4 py-3 font-medium',
                variant === 'error'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-green-600 bg-green-50 text-green-700',
                className,
            )}
        >
            <Icon
                aria-hidden="true"
                className="mt-px size-4.5 flex-none"
                strokeWidth={2}
            />
            <span>{children}</span>
        </div>
    );
}
