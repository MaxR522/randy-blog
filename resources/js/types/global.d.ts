import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            [key: string]: unknown;
        };
        flashDataType: {
            success?: string;
            error?: string;
            /** Shown once, right after 2FA is confirmed or its codes regenerated. */
            recoveryCodes?: string[];
            /** Accessibility problems found in the content of the article just saved (A11Y-BODY-5). */
            accessibilityWarnings?: string[];
            /** The subscription form was accepted (PUB-SUB-4), whatever the address. */
            subscribed?: boolean;
        };
    }
}
