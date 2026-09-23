import type { AnchorHTMLAttributes } from 'react';
import { labels } from '@/lib/labels.fr';

type ExternalLinkProps = Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'target' | 'rel'
> & {
    href: string;
};

/**
 * Link to another site, opened in a new tab. Screen readers hear « (nouvel onglet) » after the link text.
 */
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
    return (
        <a target="_blank" rel="noopener noreferrer" {...props}>
            {children}
            <span className="sr-only"> {labels.a11y.newTab}</span>
        </a>
    );
}
