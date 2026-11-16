import type { LucideIcon } from 'lucide-react';
import { BarChart3, FileText, Folder, Mail, User } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { home, logout } from '@/routes';
import { account, index as analytics } from '@/routes/admin';
import articles from '@/routes/admin/articles';
import categories from '@/routes/admin/categories';
import newsletters from '@/routes/admin/newsletters';
import subscriptions from '@/routes/admin/subscriptions';

const text = adminLabels.shell;

export type SidebarItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Other paths that belong to the item, such as the newsletter composer under « Abonnements ». */
    sections?: string[];
    /** Matches the path itself only, since `/admin` is the start of every other admin path. */
    isExact?: boolean;
};

/** The admin sections, in sidebar order. */
export const sidebarItems: SidebarItem[] = [
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

/** « Voir le site » and « Se déconnecter » at the foot of the sidebar. */
export const sidebarFooterUrls = { site: home.url(), logout: logout() };

/** Whether the page at `url` (a path) belongs to the item. Wayfinder URLs are absolute (APP_URL), the page URL is a path. */
export function isActiveItem(item: SidebarItem, url: string): boolean {
    return [item.href, ...(item.sections ?? [])].some((path) => {
        const pathname = new URL(path, window.location.origin).pathname;

        return item.isExact
            ? url.split('?')[0].replace(/\/$/, '') ===
                  pathname.replace(/\/$/, '')
            : url.startsWith(pathname);
    });
}
