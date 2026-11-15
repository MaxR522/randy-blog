import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { NewslettersTable } from '@/components/admin/newsletters/newsletters-table';
import { PageHeader } from '@/components/admin/page-header';
import {
    CreateNewsletterLink,
    SubscriptionTabs,
} from '@/components/admin/subscriptions/subscription-tabs';
import { newsletterRowsOf } from '@/helpers/newsletters';
import { subscriptionsUrlsOf } from '@/helpers/subscriptions';
import { useNewsletterDuplicate } from '@/hooks/use-newsletter-duplicate';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AdminList, AdminNewsletter } from '@/types/admin';

const text = adminLabels.newsletters;
const tabsText = adminLabels.subscriptions;

type NewslettersProps = {
    newsletters: AdminList<AdminNewsletter>;
    subscriberCount: number;
    newsletterCount: number;
};

/**
 * « Newsletters envoyées », the second tab of « Abonnements » (ADM-SUB-10). A draft is reopened; the others are
 * viewed and duplicated.
 */
export default function Newsletters({
    newsletters,
    subscriberCount,
    newsletterCount,
}: NewslettersProps) {
    const urls = subscriptionsUrlsOf();
    const rows = newsletterRowsOf(newsletters.data);
    const { duplicate } = useNewsletterDuplicate();

    return (
        <>
            <AdminHead title={tabsText.newslettersTab} />
            <PageHeader
                title={tabsText.title}
                action={<CreateNewsletterLink href={urls.createNewsletter} />}
            />

            <SubscriptionTabs
                current="newsletters"
                subscriberCount={subscriberCount}
                newsletterCount={newsletterCount}
                subscribersUrl={urls.subscribers}
                newslettersUrl={urls.newsletters}
            />

            {rows.length > 0 ? (
                <>
                    <NewslettersTable
                        rows={rows}
                        onDuplicate={(newsletter) => duplicate(newsletter.id)}
                    />
                    <ListPagination
                        currentPage={newsletters.currentPage}
                        lastPage={newsletters.lastPage}
                        previousUrl={newsletters.previousUrl}
                        nextUrl={newsletters.nextUrl}
                    />
                </>
            ) : (
                <EmptyState icon={Mail} message={text.empty} />
            )}
        </>
    );
}

Newsletters.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
