import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { FlashToasts } from '@/components/admin/flash-toasts';
import { labels } from '@/lib/labels.fr';

type AdminAuthLayoutProps = {
    title: string;
    /** Above the title, inside the card, such as a back link. */
    before?: ReactNode;
    /** Below the card, such as the login error. */
    after?: ReactNode;
    children: ReactNode;
};

/**
 * Pages used before logging in: a card on a grey page, or a plain white page on phones.
 */
export default function AdminAuthLayout({
    title,
    before,
    after,
    children,
}: AdminAuthLayoutProps) {
    return (
        <div className="text-primary tablet:bg-grey-subtle flex min-h-screen flex-col bg-white">
            <AdminHead title={title} />
            <FlashToasts />
            <header className="border-grey-light tablet:h-16 tablet:px-8 flex h-14 flex-none items-center border-b bg-white px-4">
                <span className="tablet:text-lg text-[1.0625rem] font-semibold tracking-[-0.01em]">
                    {labels.brand.name}
                </span>
            </header>
            <main className="tablet:px-10 tablet:pt-20 tablet:pb-10 flex flex-1 justify-center">
                <div className="tablet:w-100 w-full">
                    <div className="tablet:border tablet:border-t-2 tablet:border-grey-light tablet:border-t-primary tablet:rounded-md tablet:p-8 flex flex-col gap-5 bg-white px-4 pt-6 pb-10">
                        {before}
                        <h1 className="tablet:text-[1.75rem] text-[1.625rem] leading-tight font-semibold tracking-[-0.01em]">
                            {title}
                        </h1>
                        {children}
                    </div>
                    {after}
                </div>
            </main>
        </div>
    );
}
