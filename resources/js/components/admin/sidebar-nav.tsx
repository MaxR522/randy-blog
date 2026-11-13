import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    ExternalLink,
    FileText,
    Folder,
    LogOut,
    Mail,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import { home, logout } from '@/routes';
import { account, index as analytics } from '@/routes/admin';
import articles from '@/routes/admin/articles';
import categories from '@/routes/admin/categories';
import newsletters from '@/routes/admin/newsletters';
import subscriptions from '@/routes/admin/subscriptions';

const text = adminLabels.shell;

/** `sections`: other paths that belong to the item, such as the newsletter composer under « Abonnements ». */
const items: {
    label: string;
    href: string;
    icon: LucideIcon;
    sections?: string[];
    /** Matches the path itself only, since `/admin` is the start of every other admin path. */
    isExact?: boolean;
}[] = [
    {
        label: text.analytics,
        href: analytics.url(),
        icon: BarChart3,
        isExact: true,
    },
    { label: text.articles, href: articles.index.url(), icon: FileText },
    { label: text.categories, href: categories.index.url(), icon: Folder },
    {
        label: text.subscriptions,
        href: subscriptions.index.url(),
        icon: Mail,
        sections: [newsletters.create.url().replace(/\/nouvelle$/, '')],
    },
    { label: text.account, href: account.url(), icon: User },
];

type SidebarNavProps = {
    label: string;
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
export function SidebarNav({ label, isCollapsed = false }: SidebarNavProps) {
    const { url } = usePage();
    const collapsedLabel = (itemLabel: string) =>
        isCollapsed ? { 'aria-label': itemLabel, title: itemLabel } : {};

    return (
        <nav aria-label={label} className="flex flex-1 flex-col gap-1">
            {items.map(
                ({
                    label: itemLabel,
                    href,
                    icon: Icon,
                    sections = [],
                    isExact = false,
                }) => {
                    // Wayfinder URLs are absolute (APP_URL), the page URL is a path.
                    const isActive = [href, ...sections].some((path) => {
                        const pathname = new URL(path, window.location.origin)
                            .pathname;

                        return isExact
                            ? url.split('?')[0].replace(/\/$/, '') ===
                                  pathname.replace(/\/$/, '')
                            : url.startsWith(pathname);
                    });

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
                },
            )}
            <div className="border-grey-light mt-auto flex flex-col gap-1 border-t pt-2">
                <a
                    href={home.url()}
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
                    href={logout()}
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
