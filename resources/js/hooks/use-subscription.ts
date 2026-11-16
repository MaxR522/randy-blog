import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { store } from '@/routes/subscriptions';

/**
 * Newsletter subscription, double opt-in (PUB-SUB-1…5), with the honeypot field (PUB-SUB-3). The server answers
 * every valid address the same way, so the success never tells whether it was already known. Focus goes to the
 * email field on an error and to the success message once subscribed.
 */
export function useSubscription() {
    const form = useForm({ email: '', website: '' });
    const [isSubscribed, setIsSubscribed] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const successRef = useRef<HTMLParagraphElement>(null);
    const error = form.errors.email ?? null;

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            preserveState: true,
            onFlash: (flash) => {
                if (flash.subscribed) {
                    setIsSubscribed(true);
                }
            },
        });
    }

    useEffect(() => {
        if (error) {
            emailRef.current?.focus();
        }
    }, [error]);

    useEffect(() => {
        if (isSubscribed) {
            successRef.current?.focus();
        }
    }, [isSubscribed]);

    return {
        emailRef,
        successRef,
        email: form.data.email,
        website: form.data.website,
        error,
        isSubscribed,
        isLoading: !isSubscribed && form.processing,
        changeEmail: (email: string): void => form.setData('email', email),
        changeWebsite: (website: string): void =>
            form.setData('website', website),
        submit,
    };
}

export type Subscription = ReturnType<typeof useSubscription>;
