import { router } from '@inertiajs/react';
import { duplicate as duplicateNewsletter } from '@/actions/App/Http/Controllers/Admin/NewsletterController';

/**
 * « Dupliquer » (ADM-SUB-10): copies a newsletter into a new draft, which the server then opens.
 */
export function useNewsletterDuplicate() {
    return {
        duplicate: (id: number): void => {
            router.post(duplicateNewsletter.url(id));
        },
    };
}
