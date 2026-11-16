import { Link } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/public/button';
import { frenchTypography } from '@/helpers/typography';
import type { Subscription } from '@/hooks/use-subscription';
import { labels } from '@/lib/labels.fr';

const [consentText] = labels.subscription.consent.split(labels.footer.privacy);

type SubscriptionBlockProps = {
    /** From `useSubscription`, called by the page. */
    subscription: Subscription;
    privacyUrl: string;
};

/**
 * Newsletter band (`#abonnement`), double opt-in (PUB-SUB-1…5): the form, then the success message.
 */
export function SubscriptionBlock({
    subscription,
    privacyUrl,
}: SubscriptionBlockProps) {
    const { error, isLoading } = subscription;

    return (
        <section
            id="abonnement"
            aria-labelledby="abonnement-titre"
            className="border-accent-200 bg-accent-50 border-y"
        >
            <div className="px-gutter laptop:grid-cols-2 laptop:items-center laptop:gap-16 laptop:py-20 mx-auto grid w-full max-w-7xl gap-8 py-12">
                <div>
                    <h2
                        id="abonnement-titre"
                        className="laptop:text-5xl/[1.05] tablet:leading-[1.05] font-sans text-[2.125rem] leading-[1.15] font-semibold tracking-[-0.02em]"
                    >
                        {labels.subscription.title}
                    </h2>
                    <p className="text-body laptop:text-lg/7 mt-4 max-w-115">
                        {labels.subscription.description}
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    {subscription.isSubscribed ? (
                        <p
                            ref={subscription.successRef}
                            role="status"
                            tabIndex={-1}
                            className="text-body-small rounded-md border border-green-600 bg-green-50 p-4 font-medium text-green-700"
                        >
                            {frenchTypography(labels.subscription.success)}
                        </p>
                    ) : (
                        <form
                            noValidate
                            onSubmit={subscription.submit}
                            className="flex flex-col gap-2"
                        >
                            {/* Honeypot (PUB-SUB-3): off screen, out of the tab order and hidden from assistive technology. */}
                            <div
                                aria-hidden="true"
                                className="absolute left-[-9999px] size-px overflow-hidden"
                            >
                                <label htmlFor="abonnement-site">
                                    Site web
                                </label>
                                <input
                                    id="abonnement-site"
                                    name="website"
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={subscription.website}
                                    onChange={(event) =>
                                        subscription.changeWebsite(
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <label
                                htmlFor="abonnement-email"
                                className="text-body-small font-semibold"
                            >
                                {labels.subscription.emailLabel}
                            </label>
                            <div className="tablet:flex-row flex flex-col gap-3">
                                <input
                                    ref={subscription.emailRef}
                                    id="abonnement-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={subscription.email}
                                    onChange={(event) =>
                                        subscription.changeEmail(
                                            event.target.value,
                                        )
                                    }
                                    readOnly={isLoading}
                                    placeholder={
                                        labels.subscription.emailPlaceholder
                                    }
                                    aria-invalid={error ? true : undefined}
                                    aria-describedby={
                                        error
                                            ? 'abonnement-erreur abonnement-consentement'
                                            : 'abonnement-consentement'
                                    }
                                    className="border-grey-medium text-body text-primary placeholder:text-grey-dark focus-visible:border-primary tablet:w-auto tablet:min-w-0 tablet:flex-1 h-13 w-full rounded-md border bg-white px-4 aria-invalid:border-red-600 aria-invalid:ring-1 aria-invalid:ring-red-600"
                                />
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="h-13"
                                >
                                    {frenchTypography(labels.nav.subscribe)}
                                </Button>
                            </div>
                            {error && (
                                <p
                                    id="abonnement-erreur"
                                    role="alert"
                                    className="text-body-small flex items-center gap-1.5 font-medium text-red-700"
                                >
                                    <CircleAlert
                                        aria-hidden="true"
                                        className="size-4 flex-none"
                                        strokeWidth={2}
                                    />
                                    {error}
                                </p>
                            )}
                        </form>
                    )}
                    <p
                        id="abonnement-consentement"
                        className="text-caption text-grey-dark"
                    >
                        {consentText}
                        <Link
                            href={privacyUrl}
                            className="text-accent-700 hover:text-accent-800 underline underline-offset-3"
                        >
                            {labels.footer.privacy}
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </section>
    );
}
