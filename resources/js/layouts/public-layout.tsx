import type { ReactNode } from 'react';
import { buttonClasses } from '@/components/public/button';
import { Footer } from '@/components/public/footer';
import type { NavbarVariant } from '@/components/public/navbar';
import { Navbar } from '@/components/public/navbar';
import { PageAnnouncer } from '@/components/public/page-announcer';
import { labels } from '@/lib/labels.fr';

type PublicLayoutProps = {
    navbar: NavbarVariant;
    authorUrl?: string | null;
    children: ReactNode;
};

const MAIN_ID = 'contenu';

export default function PublicLayout({
    navbar,
    authorUrl,
    children,
}: PublicLayoutProps) {
    return (
        <div className="text-primary flex min-h-screen flex-col bg-white">
            <a
                href={`#${MAIN_ID}`}
                className={buttonClasses(
                    'primary',
                    'fixed top-3 left-3 z-50 -translate-y-20 focus:translate-y-0',
                )}
            >
                {labels.a11y.skipToContent}
            </a>
            <Navbar variant={navbar} authorUrl={authorUrl} />
            <main
                id={MAIN_ID}
                tabIndex={-1}
                className="flex-1 focus:outline-none"
            >
                {children}
            </main>
            <Footer />
            <PageAnnouncer mainId={MAIN_ID} />
        </div>
    );
}
