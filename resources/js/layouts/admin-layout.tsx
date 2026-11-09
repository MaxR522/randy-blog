import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { SidebarDrawer } from '@/components/admin/sidebar-drawer';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { TopBar } from '@/components/admin/top-bar';
import { buttonClasses } from '@/components/public/button';
import { PageAnnouncer } from '@/components/public/page-announcer';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const MAIN_ID = 'contenu';
const COLLAPSED_STORAGE_KEY = 'admin-sidebar-collapsed';

function readIsCollapsed(): boolean {
    try {
        return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function storeIsCollapsed(isCollapsed: boolean): void {
    try {
        window.localStorage.setItem(
            COLLAPSED_STORAGE_KEY,
            isCollapsed ? '1' : '0',
        );
    } catch {
        // Storage can be blocked: the sidebar just forgets its state.
    }
}

/**
 * Shell of the logged-in admin pages, used as a persistent layout so the sidebar survives page visits.
 * Client-rendered only (`HandleInertiaRequests::$withoutSsr`), so it can read `localStorage` on first render.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();
    const [isCollapsed, setIsCollapsed] = useState(readIsCollapsed);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

    function toggleSidebar(): void {
        storeIsCollapsed(!isCollapsed);
        setIsCollapsed(!isCollapsed);
    }

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
                isSidebarCollapsed={isCollapsed}
                onToggleSidebar={toggleSidebar}
                onOpenDrawer={() => setIsDrawerOpen(true)}
            />
            <div className="flex flex-1">
                <aside
                    className={cn(
                        'border-grey-light laptop:flex sticky top-16 hidden h-[calc(100dvh-4rem)] flex-none flex-col border-r px-3 py-4',
                        isCollapsed ? 'w-20' : 'w-64',
                    )}
                >
                    <SidebarNav
                        label={adminLabels.shell.nav}
                        isCollapsed={isCollapsed}
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
            <SidebarDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
            {/* Keyed by path: the layout persists, so this remounts to announce each new page, but not a `?q=` change. */}
            <PageAnnouncer key={url.split('?')[0]} mainId={MAIN_ID} />
        </div>
    );
}
