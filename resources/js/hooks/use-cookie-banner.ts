import { useEffect, useRef, useState } from 'react';
import { setConsent } from '@/helpers/cookie-consent';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import {
    disableGoogleAnalytics,
    loadGoogleAnalytics,
} from '@/lib/google-analytics';
import { labels } from '@/lib/labels.fr';

/**
 * The consent banner's behaviour: the GA4 tag loaded only after consent (and turned off on a refusal), the
 * « Personnaliser » dialog following the store, and the choice, announced with the focus back on `main`.
 */
export function useCookieBanner(measurementId: string | null, mainId: string) {
    const { consent, isPreferencesOpen } = useCookieConsent();
    const [announcement, setAnnouncement] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);

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

    return { consent, isPreferencesOpen, announcement, dialogRef, choose };
}
