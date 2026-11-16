import { Deferred } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { AnalyticsSkeleton } from '@/components/admin/analytics/analytics-skeleton';
import { BlogFigures } from '@/components/admin/analytics/blog-figures';
import { GoogleFigures } from '@/components/admin/analytics/google-figures';
import { PeriodPicker } from '@/components/admin/analytics/period-picker';
import { PageHeader } from '@/components/admin/page-header';
import { analyticsCaptionOf, analyticsFiguresOf } from '@/helpers/analytics';
import { useAnalyticsPeriod } from '@/hooks/use-analytics-period';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AnalyticsBlog, AnalyticsReport } from '@/types/admin';

const text = adminLabels.analytics;

type AnalyticsProps = {
    period: number;
    range: { start: string; end: string };
    blog: AnalyticsBlog;
    analytics?: AnalyticsReport | null;
};

/**
 * « Analytique » (ADM-ANA-1…6): GA4 figures, deferred and cached, then the blog figures from the database.
 */
export default function Analytics({
    period,
    range,
    blog,
    analytics,
}: AnalyticsProps) {
    const picker = useAnalyticsPeriod(period);

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader
                title={text.title}
                action={
                    <PeriodPicker
                        shownPeriod={picker.shownPeriod}
                        onChoose={picker.choose}
                    />
                }
            />
            <p className="text-body-small text-grey-dark mb-6">
                {analyticsCaptionOf(range, period)}
            </p>

            {picker.isLoading ? (
                <AnalyticsSkeleton />
            ) : (
                <Deferred
                    key={period}
                    data="analytics"
                    fallback={<AnalyticsSkeleton />}
                >
                    <GoogleFigures report={analyticsFiguresOf(analytics)} />
                </Deferred>
            )}

            <BlogFigures blog={blog} />
        </>
    );
}

Analytics.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
