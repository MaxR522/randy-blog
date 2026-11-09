import { Head } from '@inertiajs/react';
import { adminLabels } from '@/lib/labels.admin.fr';

type AdminHeadProps = {
    title: string;
};

/**
 * Title and robots tag of an admin page (SEO-CRAWL-3). `NoIndexHeader` sends the matching header.
 */
export function AdminHead({ title }: AdminHeadProps) {
    return (
        <Head title={`${title} — ${adminLabels.titleSuffix}`}>
            <meta name="robots" content="noindex, nofollow" />
        </Head>
    );
}
