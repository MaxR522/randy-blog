declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        [key: `ga-disable-${string}`]: boolean | undefined;
    }
}

let isLoaded = false;

/**
 * Loads the GA4 tag. Call only once the visitor has consented.
 */
export function loadGoogleAnalytics(measurementId: string): void {
    window[`ga-disable-${measurementId}`] = false;

    if (isLoaded) {
        return;
    }

    isLoaded = true;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
        // gtag.js reads the `arguments` object itself, not an array.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const script = document.createElement('script');

    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
}

/**
 * Stops measuring and removes the `_ga` cookies when consent is withdrawn.
 */
export function disableGoogleAnalytics(measurementId: string): void {
    window[`ga-disable-${measurementId}`] = true;

    const suffix = measurementId.replace(/^G-/, '');
    const names = ['_ga', `_ga_${suffix}`, '_gid'];
    const hostname = window.location.hostname;
    const parentDomain = `.${hostname.split('.').slice(-2).join('.')}`;
    const domains = [...new Set([undefined, hostname, parentDomain])];

    names.forEach((name) =>
        domains.forEach((domain) => {
            document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
        }),
    );
}
