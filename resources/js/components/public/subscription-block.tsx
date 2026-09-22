import { Link } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/public/button';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { privacy } from '@/routes';

export type SubscriptionStatus = 'idle' | 'loading' | 'success';

type SubscriptionBlockProps = {
    status?: SubscriptionStatus;
    error?: string | null;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

const [consentText] = labels.subscription.consent.split(labels.footer.privacy);

/**
 * Newsletter band (`#abonnement`). Submission is wired by the subscription
 * feature through `onSubmit`, `status` and `error`.
 */
export function SubscriptionBlock({
    status = 'idle',
    error = null,
    onSubmit = (event) => event.preventDefault(),
}: SubscriptionBlockProps) {
    const isLoading = status === 'loading';

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
                        className="laptop:text-5xl/[1.05] font-sans text-[2.125rem] leading-[1.05] font-semibold tracking-[-0.02em]"
                    >
                        {labels.subscription.title}
                    </h2>
                    <p className="text-body laptop:text-lg/7 mt-4 max-w-115">
                        {labels.subscription.description}
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    {status === 'success' ? (
                        <p
                            role="status"
                            className="text-body-small rounded-md border border-green-600 bg-green-50 p-4 font-medium text-green-700"
                        >
                            {frenchTypography(labels.subscription.success)}
                        </p>
                    ) : (
                        <form
                            noValidate
                            onSubmit={onSubmit}
                            className="flex flex-col gap-2"
                        >
                            <label
                                htmlFor="abonnement-email"
                                className="text-body-small font-semibold"
                            >
                                {labels.subscription.emailLabel}
                            </label>
                            <div className="tablet:flex-row flex flex-col gap-3">
                                <input
                                    id="abonnement-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    readOnly={isLoading}
                                    placeholder={
                                        labels.subscription.emailPlaceholder
                                    }
                                    aria-invalid={error ? true : undefined}
                                    aria-describedby={
                                        error ? 'abonnement-erreur' : undefined
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
                    <p className="text-caption text-grey-dark">
                        {consentText}
                        <Link
                            href={privacy()}
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
