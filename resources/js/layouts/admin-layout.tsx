import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { FlashToasts } from '@/components/admin/flash-toasts';
import { SidebarDrawer } from '@/components/admin/sidebar-drawer';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { TopBar } from '@/components/admin/top-bar';
import { buttonClasses } from '@/components/public/button';
import { MAIN_ID } from '@/helpers/admin-shell';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import { useSidebarCollapse } from '@/hooks/use-sidebar-collapse';
import { PageAnnouncer } from '@/components/public/page-announcer';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

/**
 * Shell of the logged-in admin pages, used as a persistent layout so the sidebar survives page visits.
 * Client-rendered only (`HandleInertiaRequests::$withoutSsr`). It reads the page's URL, flash and user for the
 * shell widgets.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url, flash, props } = usePage();
    const sidebar = useSidebarCollapse();
    const toasts = useFlashToasts(flash);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

    return (
        <div className="text-primary flex min-h-screen flex-col bg-white">
            <a
                href={`#${MAIN_ID}`}
                className={buttonClasses(
                    'primary',
                    'fixed top-3 left-3 z-50 -translate-y-20 focus:translate-y-0',
                )}
            >
                {adminLabels.shell.skipToContent}
            </a>
            <TopBar
                isSidebarCollapsed={sidebar.isCollapsed}
                onToggleSidebar={sidebar.toggle}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                avatarUrl={props.auth.user?.avatar ?? null}
            />
            <div className="flex flex-1">
                <aside
                    className={cn(
                        'border-grey-light laptop:flex sticky top-16 hidden h-[calc(100dvh-4rem)] flex-none flex-col border-r px-3 py-4',
                        sidebar.isCollapsed ? 'w-20' : 'w-64',
                    )}
                >
                    <SidebarNav
                        label={adminLabels.shell.nav}
                        currentUrl={url}
                        isCollapsed={sidebar.isCollapsed}
                    />
                </aside>
                <main
                    id={MAIN_ID}
                    tabIndex={-1}
                    className="min-w-0 flex-1 focus:outline-none"
                >
                    <div className="px-gutter laptop:py-8 mx-auto w-full max-w-7xl py-6">
                        {children}
                    </div>
                </main>
            </div>
            <SidebarDrawer
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                currentUrl={url}
            />
            <FlashToasts toasts={toasts} />
            {/* Keyed by path: the layout persists, so this remounts to announce each new page, but not a `?q=` change. */}
            <PageAnnouncer key={url.split('?')[0]} mainId={MAIN_ID} />
        </div>
    );
}
