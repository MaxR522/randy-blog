import { usePage } from '@inertiajs/react';
import { Cookie } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/public/button';
import {
    closePreferences,
    openPreferences,
    setConsent,
    useCookieConsent,
} from '@/lib/cookie-consent';
import {
    disableGoogleAnalytics,
    loadGoogleAnalytics,
} from '@/lib/google-analytics';
import { labels } from '@/lib/labels.fr';

type CookieConsentProps = {
    mainId: string;
};

/**
 * Consent banner (non-modal region), its « Personnaliser » dialog, and the GA4 tag, loaded only after consent.
 * Mounted by the public layout, so it never runs on admin pages.
 */
export function CookieConsent({ mainId }: CookieConsentProps) {
    const { analytics } = usePage().props;
    const measurementId = analytics.measurementId;
    const { consent, isPreferencesOpen } = useCookieConsent();
    const [announcement, setAnnouncement] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const checkboxId = useId();
    const hintId = useId();

    useEffect(() => {
        if (!measurementId) {
            return;
        }

        if (consent === 'granted') {
            loadGoogleAnalytics(measurementId);
        } else if (consent === 'denied' && window.gtag) {
            disableGoogleAnalytics(measurementId);
        }
    }, [consent, measurementId]);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (isPreferencesOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isPreferencesOpen && dialog.open) {
            dialog.close();
        }
    }, [isPreferencesOpen, consent]);

    function choose(isGranted: boolean): void {
        const previousConsent = consent;

        setConsent(isGranted ? 'granted' : 'denied');

        // A loaded GA4 tag cannot be unloaded: a changed choice starts from a clean page.
        if (
            previousConsent !== 'undecided' &&
            previousConsent !== (isGranted ? 'granted' : 'denied')
        ) {
            window.location.reload();

            return;
        }

        setAnnouncement(
            isGranted
                ? labels.cookies.acceptedAnnouncement
                : labels.cookies.refusedAnnouncement,
        );
        document.getElementById(mainId)?.focus({ preventScroll: true });
    }

    return (
        <>
            {consent === 'undecided' && (
                <section
                    role="region"
                    aria-label={labels.cookies.region}
                    className="border-grey-light border-t-primary tablet:inset-x-6 tablet:bottom-6 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-8 tablet:px-6 tablet:py-5 fixed inset-x-4 bottom-4 z-40 flex flex-col gap-4 rounded-lg border border-t-2 bg-white px-4 pt-5 pb-4"
                >
                    <div className="tablet:gap-3.5 flex max-w-160 gap-3">
                        <Cookie
                            aria-hidden="true"
                            strokeWidth={1.75}
                            className="text-primary tablet:size-5.5 mt-0.5 size-5 flex-none"
                        />
                        <p className="text-body-small tablet:text-[0.9375rem]/[1.45] text-primary">
                            {labels.cookies.text}
                        </p>
                    </div>
                    <div className="tablet:flex-row tablet:gap-2.5 flex flex-col-reverse gap-2">
                        <Button variant="ghost" onClick={openPreferences}>
                            {labels.cookies.customize}
                        </Button>
                        <Button onClick={() => choose(false)}>
                            {labels.cookies.refuse}
                        </Button>
                        <Button onClick={() => choose(true)}>
                            {labels.cookies.accept}
                        </Button>
                    </div>
                </section>
            )}
            {consent !== 'unknown' && (
                <dialog
                    ref={dialogRef}
                    aria-labelledby={titleId}
                    onClose={closePreferences}
                    className="text-primary border-grey-light m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border bg-white p-6 backdrop:bg-black/50"
                >
                    <form
                        key={String(isPreferencesOpen)}
                        onSubmit={(event) => {
                            event.preventDefault();
                            choose(
                                new FormData(event.currentTarget).has(
                                    'analytics',
                                ),
                            );
                        }}
                    >
                        <h2 id={titleId} className="text-h3 font-sans">
                            {labels.cookies.dialogTitle}
                        </h2>
                        <p className="text-body-small text-grey-dark mt-2">
                            {labels.cookies.dialogIntro}
                        </p>
                        <div className="mt-5 flex items-start gap-3">
                            <input
                                id={checkboxId}
                                type="checkbox"
                                name="analytics"
                                defaultChecked={consent === 'granted'}
                                aria-describedby={hintId}
                                className="accent-primary mt-0.5 size-6 flex-none"
                            />
                            <div>
                                <label
                                    htmlFor={checkboxId}
                                    className="text-body font-medium"
                                >
                                    {labels.cookies.analyticsLabel}
                                </label>
                                <p
                                    id={hintId}
                                    className="text-body-small text-grey-dark mt-1"
                                >
                                    {labels.cookies.analyticsHint}
                                </p>
                            </div>
                        </div>
                        <div className="tablet:flex-row tablet:justify-end mt-6 flex flex-col-reverse gap-2">
                            <Button variant="ghost" onClick={closePreferences}>
                                {labels.cookies.close}
                            </Button>
                            <Button type="submit">{labels.cookies.save}</Button>
                        </div>
                    </form>
                </dialog>
            )}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
        </>
    );
}
