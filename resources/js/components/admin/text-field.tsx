import { CircleAlert } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
    help?: string;
    /** Shown at the end of the label row, such as a link. */
    labelAction?: ReactNode;
    /** Shown over the end of the input, such as an icon button. */
    trailing?: ReactNode;
};

/**
 * Labelled input with help text and an inline error tied to it by `aria-describedby`.
 */
export function TextField({
    label,
    error,
    help,
    labelAction,
    trailing,
    className,
    'aria-describedby': describedBy,
    'aria-invalid': isInvalid,
    ...inputProps
}: TextFieldProps) {
    const id = useId();
    const helpId = `${id}-aide`;
    const errorId = `${id}-erreur`;
    const descriptionIds = [
        describedBy,
        help ? helpId : null,
        error ? errorId : null,
    ]
        .filter(Boolean)
        .join(' ');
    const hasError = Boolean(error) || isInvalid === true;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
                <label
                    htmlFor={id}
                    className="text-body-small text-primary font-semibold"
                >
                    {label}
                </label>
                {labelAction}
            </div>
            <div className="relative">
                <input
                    id={id}
                    aria-invalid={hasError || undefined}
                    aria-describedby={descriptionIds || undefined}
                    className={cn(
                        'border-grey-medium text-body text-primary focus:border-primary read-only:bg-grey-subtle h-12 w-full rounded-md border bg-white px-4',
                        trailing && 'pr-13',
                        hasError && 'border-red-600 ring-1 ring-red-600',
                        className,
                    )}
                    {...inputProps}
                />
                {trailing}
            </div>
            {help && (
                <p id={helpId} className="text-caption text-grey-dark">
                    {help}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="text-body-small flex gap-1.5 font-medium text-red-700"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-0.5 size-4 flex-none"
                        strokeWidth={2}
                    />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}
