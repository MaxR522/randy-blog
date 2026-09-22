import type { ReactNode } from 'react';
import { Footer } from '@/components/public/footer';
import type { NavbarVariant } from '@/components/public/navbar';
import { Navbar } from '@/components/public/navbar';

type PublicLayoutProps = {
    navbar: NavbarVariant;
    authorUrl?: string | null;
    children: ReactNode;
};

export default function PublicLayout({
    navbar,
    authorUrl,
    children,
}: PublicLayoutProps) {
    return (
        <div className="text-primary flex min-h-screen flex-col bg-white">
            <Navbar variant={navbar} authorUrl={authorUrl} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
