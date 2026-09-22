import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover active:bg-black disabled:border-[#EBEBEB] disabled:bg-[#EBEBEB] disabled:text-grey-medium',
    secondary:
        'border-primary bg-white text-primary hover:bg-grey-subtle active:bg-[#E8E8E8] disabled:border-grey-light disabled:bg-white disabled:text-grey-medium',
    ghost: 'border-transparent text-primary underline-offset-4 hover:underline active:bg-grey-subtle disabled:text-grey-medium',
};

/**
 * Classes of the public button, also used to style links as buttons.
 */
export function buttonClasses(
    variant: ButtonVariant = 'primary',
    className?: string,
): string {
    return cn(
        'text-button ease-standard inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 font-semibold whitespace-nowrap transition-colors duration-(--duration-base) disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
    );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    isLoading?: boolean;
};

export function Button({
    variant = 'primary',
    isLoading = false,
    type = 'button',
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            aria-busy={isLoading || undefined}
            className={buttonClasses(
                variant,
                cn(isLoading && 'cursor-progress', className),
            )}
            {...props}
        >
            {isLoading && (
                <LoaderCircle
                    aria-hidden="true"
                    className="size-4.5 animate-spin"
                    strokeWidth={1.75}
                />
            )}
            {children}
        </button>
    );
}
