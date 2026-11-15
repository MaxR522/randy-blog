import { useSyncExternalStore } from 'react';
import {
    consentSnapshot,
    serverConsentSnapshot,
    subscribeToConsent,
} from '@/helpers/cookie-consent';
import type { ConsentSnapshot } from '@/helpers/cookie-consent';

/** The visitor's cookie consent and whether the preferences dialog is open, `unknown` until the cookie is read. */
export function useCookieConsent(): ConsentSnapshot {
    return useSyncExternalStore(
        subscribeToConsent,
        consentSnapshot,
        () => serverConsentSnapshot,
    );
}
