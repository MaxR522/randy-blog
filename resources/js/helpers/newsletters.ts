import { show } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import type { AdminNewsletter } from '@/types/admin';

/** A newsletter of the list with the URL that reopens the draft or shows the sent email. */
export type NewsletterRow = AdminNewsletter & { showUrl: string };

/**
 * Rows of the list, each with the URL of its page.
 */
export function newsletterRowsOf(
    newsletters: AdminNewsletter[],
): NewsletterRow[] {
    return newsletters.map((newsletter) => ({
        ...newsletter,
        showUrl: show.url(newsletter.id),
    }));
}
