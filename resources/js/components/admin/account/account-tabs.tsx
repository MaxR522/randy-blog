import { Link } from '@inertiajs/react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.account;

type AccountTabsProps = {
    current: 'profile' | 'security';
    profileUrl: string;
    securityUrl: string;
};

/**
 * « Profil » and « Sécurité »: two pages, so links marked with `aria-current` rather than ARIA tabs.
 */
export function AccountTabs({
    current,
    profileUrl,
    securityUrl,
}: AccountTabsProps) {
    const tabs = [
        { key: 'profile', label: text.profileTab, href: profileUrl },
        { key: 'security', label: text.securityTab, href: securityUrl },
    ] as const;

    return (
        <nav
            aria-label={text.tabs}
            className="border-grey-light tablet:gap-7 flex border-b"
        >
            {tabs.map((tab) => {
                const isCurrent = tab.key === current;

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                            'tablet:flex-none -mb-px flex h-11 flex-1 items-center justify-center border-b-2 text-[0.9375rem]',
                            isCurrent
                                ? 'border-primary text-primary font-semibold'
                                : 'text-grey-dark hover:text-primary border-transparent font-medium',
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
