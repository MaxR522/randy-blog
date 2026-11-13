import { Link } from '@inertiajs/react';
import { CircleCheck, Clock, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { buttonClasses } from '@/components/public/button';
import { Seo } from '@/components/public/seo';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { SeoData } from '@/types';

type SubscriptionState = 'confirmed' | 'expired' | 'unsubscribed';

type SubscriptionStatusProps = {
    seo: SeoData;
    state: SubscriptionState;
};

type Action = {
    label: string;
    href: string;
    variant: 'primary' | 'secondary' | 'ghost';
    /** The subscription form is a section of the home page: a full page load lands on its anchor. */
    isAnchor?: boolean;
};

const text = labels.confirmation;
const subscribeHref = `${home.url()}#abonnement`;

const states: Record<
    SubscriptionState,
    {
        icon: LucideIcon;
        iconClassName: string;
        title: string;
        body: string;
        actions: Action[];
    }
> = {
    confirmed: {
        icon: CircleCheck,
        iconClassName: 'bg-green-50 text-green-700',
        title: text.confirmedTitle,
        body: text.confirmedText,
        actions: [
            { label: text.readLatest, href: home.url(), variant: 'primary' },
        ],
    },
    expired: {
        icon: Clock,
        iconClassName: 'bg-yellow-50 text-yellow-800',
        title: text.expiredTitle,
        body: text.expiredText,
        actions: [
            {
                label: text.subscribeAgain,
                href: subscribeHref,
                variant: 'primary',
                isAnchor: true,
            },
            {
                label: labels.nav.backHome,
                href: home.url(),
                variant: 'ghost',
            },
        ],
    },
    unsubscribed: {
        icon: Mail,
        iconClassName: 'bg-accent-50 text-accent-700',
        title: text.unsubscribedTitle,
        body: text.unsubscribedText,
        actions: [
            {
                label: labels.nav.backHome,
                href: home.url(),
                variant: 'secondary',
            },
            {
                label: text.resubscribe,
                href: subscribeHref,
                variant: 'ghost',
                isAnchor: true,
            },
        ],
    },
};

/**
 * Pages reached from the subscription emails (PUB-SUB-6, PUB-SUB-8): confirmed, expired link, unsubscribed.
 * Never indexed (`Seo::private`, `/abonnement/` disallowed in robots.txt).
 */
export default function SubscriptionStatus({
    seo,
    state,
}: SubscriptionStatusProps) {
    const { icon: Icon, iconClassName, title, body, actions } = states[state];

    return (
        <PublicLayout navbar="back">
            <Seo seo={seo} />

            <div className="px-gutter laptop:py-24 mx-auto w-full max-w-7xl py-8">
                <div className="tablet:mx-auto flex max-w-150 flex-col items-start gap-5">
                    <span
                        className={cn(
                            'flex size-14 items-center justify-center rounded-full',
                            iconClassName,
                        )}
                    >
                        <Icon
                            aria-hidden="true"
                            className="size-7"
                            strokeWidth={1.75}
                        />
                    </span>
                    <h1 className="mt-1 font-sans text-[2.375rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
                        {frenchTypography(title)}
                    </h1>
                    <p className="text-body leading-6.5">
                        {frenchTypography(body)}
                    </p>
                    <div className="tablet:w-auto mt-2 flex w-full flex-col items-start gap-2">
                        {actions.map((action) => {
                            const className = buttonClasses(
                                action.variant,
                                cn(
                                    action.variant === 'ghost'
                                        ? 'px-0'
                                        : 'tablet:w-auto w-full',
                                ),
                            );
                            const label = frenchTypography(action.label);

                            return action.isAnchor ? (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className={className}
                                >
                                    {label}
                                </a>
                            ) : (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className={className}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
