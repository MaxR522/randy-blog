import { useSyncExternalStore } from 'react';

export type ConsentChoice = 'granted' | 'denied';

/** `unknown` until the browser has read the cookie, so the server and hydration render nothing. */
export type ConsentState = ConsentChoice | 'undecided' | 'unknown';

const COOKIE_NAME = 'randy-blog-consent';
/** 6 months, as stated in the privacy policy. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type Snapshot = { consent: ConsentState; isPreferencesOpen: boolean };

let snapshot: Snapshot = { consent: 'unknown', isPreferencesOpen: false };
const listeners = new Set<() => void>();
const serverSnapshot: Snapshot = {
    consent: 'unknown',
    isPreferencesOpen: false,
};

function emit(next: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
}

function readCookie(): ConsentState {
    const match = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
    const value = match?.slice(COOKIE_NAME.length + 1);

    return value === 'granted' || value === 'denied' ? value : 'undecided';
}

function writeCookie(choice: ConsentChoice): void {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    document.cookie = `${COOKIE_NAME}=${choice}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    if (snapshot.consent === 'unknown') {
        queueMicrotask(() => emit({ consent: readCookie() }));
    }

    return () => {
        listeners.delete(listener);
    };
}

export function useCookieConsent(): Snapshot {
    return useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => serverSnapshot,
    );
}

export function setConsent(choice: ConsentChoice): void {
    writeCookie(choice);
    emit({ consent: choice, isPreferencesOpen: false });
}

export function openPreferences(): void {
    emit({ isPreferencesOpen: true });
}

export function closePreferences(): void {
    emit({ isPreferencesOpen: false });
}
