import { Link } from '@inertiajs/react';
import { ExternalLink, LogOut } from 'lucide-react';
import {
    isActiveItem,
    sidebarFooterUrls,
    sidebarItems,
} from '@/helpers/sidebar-nav';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.shell;

type SidebarNavProps = {
    label: string;
    /** The current page path, from the layout. */
    currentUrl: string;
    isCollapsed?: boolean;
};

function itemClasses(isCollapsed: boolean, isActive = false): string {
    return cn(
        'text-body-small ease-standard flex h-11 w-full cursor-pointer items-center gap-3 rounded-md font-medium whitespace-nowrap transition-colors duration-(--duration-fast)',
        isCollapsed ? 'justify-center' : 'px-3.5',
        isActive
            ? 'bg-primary text-white'
            : 'text-primary hover:bg-grey-subtle',
    );
}

/**
 * Links of the admin sidebar, in the desktop sidebar and in the phone drawer.
 * Collapsed, the items show their icon only, named by `aria-label` and `title`.
 */
export function SidebarNav({
    label,
    currentUrl,
    isCollapsed = false,
}: SidebarNavProps) {
    const collapsedLabel = (itemLabel: string) =>
        isCollapsed ? { 'aria-label': itemLabel, title: itemLabel } : {};

    return (
        <nav aria-label={label} className="flex flex-1 flex-col gap-1">
            {sidebarItems.map((item) => {
                const { label: itemLabel, href, icon: Icon } = item;
                const isActive = isActiveItem(item, currentUrl);

                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        className={itemClasses(isCollapsed, isActive)}
                        {...collapsedLabel(itemLabel)}
                    >
                        <Icon
                            aria-hidden="true"
                            className="size-5 flex-none"
                            strokeWidth={1.75}
                        />
                        {!isCollapsed && itemLabel}
                    </Link>
                );
            })}
            <div className="border-grey-light mt-auto flex flex-col gap-1 border-t pt-2">
                <a
                    href={sidebarFooterUrls.site}
                    target="_blank"
                    rel="noopener"
                    className={itemClasses(isCollapsed)}
                    {...collapsedLabel(`${text.viewSite} ${text.newTab}`)}
                >
                    <ExternalLink
                        aria-hidden="true"
                        className="size-5 flex-none"
                        strokeWidth={1.75}
                    />
                    {!isCollapsed && (
                        <>
                            {text.viewSite}
                            <span className="sr-only">{text.newTab}</span>
                        </>
                    )}
                </a>
                <Link
                    href={sidebarFooterUrls.logout}
                    as="button"
                    className={itemClasses(isCollapsed)}
                    {...collapsedLabel(text.logout)}
                >
                    <LogOut
                        aria-hidden="true"
                        className="size-5 flex-none"
                        strokeWidth={1.75}
                    />
                    {!isCollapsed && text.logout}
                </Link>
            </div>
        </nav>
    );
}
