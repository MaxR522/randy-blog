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
        };
    }
}
