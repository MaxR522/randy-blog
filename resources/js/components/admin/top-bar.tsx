import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/admin/status-badge';
import { adminLabels } from '@/lib/labels.admin.fr';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.shell;

const iconButtonClasses =
    'text-primary size-11 flex-none cursor-pointer items-center justify-center rounded-md';

type TopBarProps = {
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    onOpenDrawer: () => void;
};

/**
 * Sticky bar above the admin pages. Its menu button toggles the sidebar on desktop and opens the drawer under 1024 px.
 */
export function TopBar({
    isSidebarCollapsed,
    onToggleSidebar,
    onOpenDrawer,
}: TopBarProps) {
    const { auth } = usePage().props;
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateIsScrolled = () => setIsScrolled(window.scrollY > 0);

        updateIsScrolled();
        window.addEventListener('scroll', updateIsScrolled, { passive: true });

        return () => window.removeEventListener('scroll', updateIsScrolled);
    }, []);

    return (
        <header
            className={cn(
                'border-grey-light ease-standard laptop:h-16 laptop:px-3 sticky top-0 z-20 flex h-14 flex-none items-center justify-between gap-2 border-b bg-white px-1.5 transition-shadow duration-(--duration-base)',
                isScrolled && 'shadow-navbar',
            )}
        >
            <div className="laptop:flex-none flex min-w-0 flex-1 items-center gap-2">
                <button
                    type="button"
                    onClick={onOpenDrawer}
                    aria-label={text.openMenu}
                    className={cn(iconButtonClasses, 'laptop:hidden flex')}
                >
                    <Menu
                        aria-hidden="true"
                        className="size-5.5"
                        strokeWidth={1.75}
                    />
                </button>
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={
                        isSidebarCollapsed
                            ? text.expandSidebar
                            : text.collapseSidebar
                    }
                    aria-expanded={!isSidebarCollapsed}
                    className={cn(iconButtonClasses, 'laptop:flex hidden')}
                >
                    <Menu
                        aria-hidden="true"
                        className="size-5.5"
                        strokeWidth={1.75}
                    />
                </button>
                <span className="laptop:flex-none laptop:text-left laptop:text-lg flex-1 truncate text-center text-[1.0625rem] font-semibold tracking-[-0.01em]">
                    {labels.brand.name}
                </span>
                <StatusBadge
                    variant="muted"
                    className="laptop:inline-flex ml-1 hidden"
                >
                    {adminLabels.badge}
                </StatusBadge>
            </div>
            <div className="laptop:pr-2 flex flex-none items-center gap-2.5 pr-1.5">
                <span className="text-body-small laptop:inline hidden font-medium">
                    {labels.brand.name}
                </span>
                {auth.user?.avatar ? (
                    <img
                        src={auth.user.avatar}
                        alt=""
                        className="size-8 rounded-sm object-cover"
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        className="bg-accent-100 block size-8 rounded-sm"
                    />
                )}
            </div>
        </header>
    );
}
