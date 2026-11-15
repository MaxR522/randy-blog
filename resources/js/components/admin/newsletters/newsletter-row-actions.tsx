import { Link } from '@inertiajs/react';
import { Button, buttonClasses } from '@/components/public/button';
import type { NewsletterRow } from '@/helpers/newsletters';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletters;

type NewsletterRowActionsProps = {
    newsletter: NewsletterRow;
    variant: 'ghost' | 'secondary';
    onDuplicate: (newsletter: NewsletterRow) => void;
};

/**
 * « Reprendre » for a draft; « Voir » and, once the sending is over, « Dupliquer » for the others.
 */
export function NewsletterRowActions({
    newsletter,
    variant,
    onDuplicate,
}: NewsletterRowActionsProps) {
    const className =
        variant === 'ghost'
            ? buttonClasses('ghost', 'h-10 px-3 text-sm')
            : buttonClasses('secondary');

    if (newsletter.status === 'draft') {
        return (
            <Link
                href={newsletter.showUrl}
                aria-label={text.resumeNamed(newsletter.subject)}
                className={className}
            >
                {text.resume}
            </Link>
        );
    }

    return (
        <span className="inline-flex gap-2">
            <Link
                href={newsletter.showUrl}
                aria-label={text.viewNamed(newsletter.subject)}
                className={className}
            >
                {text.view}
            </Link>
            {newsletter.status !== 'sending' && (
                <Button
                    variant={variant}
                    onClick={() => onDuplicate(newsletter)}
                    aria-label={text.duplicateNamed(newsletter.subject)}
                    className={
                        variant === 'ghost' ? 'h-10 px-3 text-sm' : undefined
                    }
                >
                    {text.duplicate}
                </Button>
            )}
        </span>
    );
}
