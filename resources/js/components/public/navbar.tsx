import { Link } from '@inertiajs/react';
import { ArrowLeft, House } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buttonClasses } from '@/components/public/button';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

export type NavbarVariant = 'home' | 'back';

type NavbarProps = {
    variant: NavbarVariant;
    authorUrl?: string | null;
};

function ContextualLink({ variant, authorUrl }: NavbarProps) {
    const linkClasses =
        'inline-flex min-h-11 items-center gap-2 text-button font-medium text-primary hover:text-accent-800';

    if (variant === 'home') {
        if (!authorUrl) {
            return null;
        }

        return (
            <Link href={authorUrl} className={linkClasses}>
                <span className="border-b border-current">
                    {labels.nav.aboutMe}
                </span>
            </Link>
        );
    }

    return (
        <>
            <Link
                href={home()}
                aria-label={labels.nav.backHome}
                className="text-primary hover:text-accent-800 tablet:hidden flex size-11 items-center justify-center"
            >
                <House
                    aria-hidden="true"
                    className="size-5.5"
                    strokeWidth={1.75}
                />
            </Link>
            <Link
                href={home()}
                className={cn(linkClasses, 'tablet:inline-flex hidden')}
            >
                <ArrowLeft
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
                <span className="border-b border-current">
                    {frenchTypography(labels.nav.backHome)}
                </span>
            </Link>
        </>
    );
}

/**
 * Sticky public navbar, without wordmark: contextual link left, « S'abonner » right,
 * one row on every device. On phones the back link is a home-icon button.
 */
export function Navbar({ variant, authorUrl }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateIsScrolled = () => setIsScrolled(window.scrollY > 0);

        updateIsScrolled();
        window.addEventListener('scroll', updateIsScrolled, { passive: true });

        return () => window.removeEventListener('scroll', updateIsScrolled);
    }, []);

    const subscribeHref =
        variant === 'home' ? '#abonnement' : `${home.url()}#abonnement`;

    return (
        <header
            className={cn(
                'border-grey-light ease-standard sticky top-0 z-20 border-b bg-white transition-shadow duration-(--duration-base)',
                isScrolled && 'shadow-navbar',
            )}
        >
            <div className="px-gutter tablet:h-17 tablet:py-0 mx-auto flex min-h-11 w-full max-w-7xl items-center justify-between gap-4 py-3">
                <nav aria-label="Navigation" className="min-w-0">
                    <ContextualLink variant={variant} authorUrl={authorUrl} />
                </nav>
                <a href={subscribeHref} className={buttonClasses('primary')}>
                    {frenchTypography(labels.nav.subscribe)}
                </a>
            </div>
        </header>
    );
}
