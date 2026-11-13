import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import {
    create as createNewsletter,
    index as newslettersIndex,
} from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { index as subscriptionsIndex } from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { buttonClasses } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.subscriptions;

type SubscriptionTabsProps = {
    current: 'subscribers' | 'newsletters';
    subscriberCount: number;
    newsletterCount: number;
};

/**
 * « Abonnés » and « Newsletters envoyées », the two tabs of « Abonnements » (ADM-SUB-1). Each tab is a page of its own.
 */
export function SubscriptionTabs({
    current,
    subscriberCount,
    newsletterCount,
}: SubscriptionTabsProps) {
    const tabClassName =
        'tablet:flex-none flex h-11 flex-1 items-center justify-center gap-1.5 text-[0.9375rem]';
    const currentClassName = 'border-primary -mb-px border-b-2 font-semibold';
    const otherClassName = 'text-grey-dark hover:text-primary font-medium';

    return (
        <nav
            aria-label={text.tabs}
            className="border-grey-light tablet:gap-7 mb-6 flex border-b"
        >
            <Link
                href={subscriptionsIndex.url()}
                aria-current={current === 'subscribers' ? 'page' : undefined}
                className={cn(
                    tabClassName,
                    current === 'subscribers'
                        ? currentClassName
                        : otherClassName,
                )}
            >
                {text.subscribersTab}
                <span className="text-grey-dark font-medium">
                    {subscriberCount}
                </span>
            </Link>
            <Link
                href={newslettersIndex.url()}
                aria-current={current === 'newsletters' ? 'page' : undefined}
                className={cn(
                    tabClassName,
                    current === 'newsletters'
                        ? currentClassName
                        : otherClassName,
                )}
            >
                <span className="tablet:inline hidden">
                    {text.newslettersTab}
                </span>
                <span className="tablet:hidden">
                    {text.newslettersTabShort}
                </span>
                <span className="text-grey-dark font-medium">
                    {newsletterCount}
                </span>
            </Link>
        </nav>
    );
}

/**
 * « Créer une newsletter », in the header of both tabs (ADM-SUB-1).
 */
export function CreateNewsletterLink() {
    return (
        <Link
            href={createNewsletter.url()}
            className={buttonClasses('primary', 'tablet:w-auto w-full')}
        >
            <Plus aria-hidden="true" className="size-4.5" strokeWidth={2} />
            {text.createNewsletter}
        </Link>
    );
}
