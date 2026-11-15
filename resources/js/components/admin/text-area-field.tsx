import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { FieldError } from '@/components/admin/text-field';
import { cn } from '@/lib/utils';

export type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    name: string;
    error?: string;
    help?: string;
};

/**
 * Labelled textarea with help text and an inline error tied to it by `aria-describedby`, like `TextField`.
 */
export function TextAreaField({
    label,
    error,
    help,
    className,
    'aria-describedby': describedBy,
    'aria-invalid': isInvalid,
    ...textareaProps
}: TextAreaFieldProps) {
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
            <label
                htmlFor={id}
                className="text-body-small text-primary font-semibold"
            >
                {label}
            </label>
            <textarea
                id={id}
                aria-invalid={hasError || undefined}
                aria-describedby={descriptionIds || undefined}
                className={cn(
                    'border-grey-medium text-body text-primary focus:border-primary w-full resize-y rounded-md border bg-white px-4 py-3',
                    hasError && 'border-red-600 ring-1 ring-red-600',
                    className,
                )}
                {...textareaProps}
            />
            {help && (
                <p id={helpId} className="text-caption text-grey-dark">
                    {help}
                </p>
            )}
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </div>
    );
}
