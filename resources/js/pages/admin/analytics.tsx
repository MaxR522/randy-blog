import { Deferred, Link, router } from '@inertiajs/react';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { BarList } from '@/components/admin/analytics/bar-list';
import { KpiTile } from '@/components/admin/analytics/kpi-tile';
import { LineChart } from '@/components/admin/analytics/line-chart';
import { PageHeader } from '@/components/admin/page-header';
import AdminLayout from '@/layouts/admin-layout';
import {
    formatDay,
    formatDuration,
    formatNumber,
} from '@/lib/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import { index as analyticsIndex } from '@/routes/admin';
import { edit } from '@/routes/admin/articles';
import type { AnalyticsBlog, AnalyticsReport } from '@/types/admin';

const text = adminLabels.analytics;

const PERIODS = [7, 28, 90];

type AnalyticsProps = {
    period: number;
    range: { start: string; end: string };
    blog: AnalyticsBlog;
    analytics?: AnalyticsReport | null;
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="border-grey-light tablet:px-6 rounded-md border px-5 py-5">
            <h2 className="text-h4 mb-4">{title}</h2>
            {children}
        </section>
    );
}

function Skeleton() {
    return (
        <div role="status" aria-busy="true" className="flex flex-col gap-6">
            <p className="text-body-small text-grey-dark flex items-center gap-2 font-medium">
                <LoaderCircle
                    aria-hidden="true"
                    className="size-4.5 animate-spin motion-reduce:animate-none"
                    strokeWidth={1.75}
                />
                {text.loading}
            </p>
            <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="bg-grey-subtle h-28 animate-pulse rounded-md motion-reduce:animate-none"
                    />
                ))}
            </div>
            <div className="bg-grey-subtle h-72 animate-pulse rounded-md motion-reduce:animate-none" />
        </div>
    );
}

function Unavailable() {
    return (
        <div
            role="status"
            className="text-body-small flex gap-2.5 rounded-md border border-yellow-600 bg-yellow-50 px-4 py-3 font-medium text-yellow-800"
        >
            <TriangleAlert
                aria-hidden="true"
                className="mt-px size-4.5 flex-none"
                strokeWidth={2}
            />
            <span>{text.unavailable}</span>
        </div>
    );
}

function GoogleFigures({
    report,
}: {
    report: AnalyticsReport | null | undefined;
}) {
    if (report === null || report === undefined) {
        return <Unavailable />;
    }

    const { kpis } = report;

    return (
        <div className="flex flex-col gap-6">
            <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
                <KpiTile
                    label={text.kpis.users}
                    value={formatNumber(kpis.users.value)}
                    change={kpis.users.change}
                />
                <KpiTile
                    label={text.kpis.sessions}
                    value={formatNumber(kpis.sessions.value)}
                    change={kpis.sessions.change}
                />
                <KpiTile
                    label={text.kpis.pageViews}
                    value={formatNumber(kpis.pageViews.value)}
                    change={kpis.pageViews.change}
                />
                <KpiTile
                    label={text.kpis.engagement}
                    value={formatDuration(kpis.engagementSeconds.value)}
                    change={kpis.engagementSeconds.change}
                />
            </div>

            <Panel title={text.chart.title}>
                <LineChart data={report.daily} />
            </Panel>

            <div className="laptop:grid-cols-2 grid items-start gap-6">
                <Panel title={text.topArticles.title}>
                    {report.topArticles.length === 0 ? (
                        <p className="text-body-small text-grey-dark">
                            {text.topArticles.empty}
                        </p>
                    ) : (
                        <table className="text-body-small w-full border-collapse">
                            <thead>
                                <tr className="text-overline text-grey-dark uppercase">
                                    <th
                                        scope="col"
                                        className="border-primary w-8 border-b py-2.5 text-left font-semibold"
                                    >
                                        {text.topArticles.rank}
                                    </th>
                                    <th
                                        scope="col"
                                        className="border-primary border-b py-2.5 text-left font-semibold"
                                    >
                                        {text.topArticles.article}
                                    </th>
                                    <th
                                        scope="col"
                                        className="border-primary border-b py-2.5 text-right font-semibold"
                                    >
                                        {text.topArticles.views}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.topArticles.map((article, index) => (
                                    <tr key={article.id}>
                                        <td className="border-grey-light text-grey-dark border-b py-2.5">
                                            {index + 1}
                                        </td>
                                        <td className="border-grey-light border-b py-2.5 pr-3">
                                            <Link
                                                href={edit(article.id)}
                                                className="text-accent-600 underline underline-offset-4"
                                            >
                                                {article.title}
                                            </Link>
                                        </td>
                                        <td className="border-grey-light border-b py-2.5 text-right">
                                            {formatNumber(article.views)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Panel>
                <div className="flex flex-col gap-6">
                    <BarList title={text.sources} items={report.sources} />
                    <BarList title={text.devices} items={report.devices} />
                    <BarList title={text.countries} items={report.countries} />
                </div>
            </div>
        </div>
    );
}

/**
 * « Analytique » (ADM-ANA-1…6): GA4 figures, deferred and cached, then the blog figures from the database.
 */
export default function Analytics({
    period,
    range,
    blog,
    analytics,
}: AnalyticsProps) {
    // The period the author just picked, shown at once while the page for it is still loading.
    const [pendingPeriod, setPendingPeriod] = useState<number | null>(null);
    const shownPeriod = pendingPeriod ?? period;
    const day = { day: 'numeric', month: 'long' } as const;
    const caption = `${formatDay(range.start, day)} – ${formatDay(range.end, { ...day, year: 'numeric' })}, ${text.comparedWith(period)}`;

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader
                title={text.title}
                action={
                    <div
                        role="group"
                        aria-label={text.period}
                        className="border-grey-medium inline-flex self-start overflow-hidden rounded-md border"
                    >
                        {PERIODS.map((days) => (
                            <button
                                key={days}
                                type="button"
                                aria-pressed={days === shownPeriod}
                                onClick={() =>
                                    router.get(
                                        analyticsIndex.url({
                                            query: { periode: days },
                                        }),
                                        {},
                                        {
                                            preserveScroll: true,
                                            onStart: () =>
                                                setPendingPeriod(days),
                                            onFinish: () =>
                                                setPendingPeriod(null),
                                        },
                                    )
                                }
                                className={cn(
                                    'text-body-small border-grey-medium tablet:px-4 h-11 cursor-pointer border-r px-3 font-medium last:border-r-0',
                                    days === shownPeriod
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-grey-subtle',
                                )}
                            >
                                {text.periods[days]}
                            </button>
                        ))}
                    </div>
                }
            />
            <p className="text-body-small text-grey-dark mb-6">{caption}</p>

            {pendingPeriod !== null ? (
                <Skeleton />
            ) : (
                <Deferred key={period} data="analytics" fallback={<Skeleton />}>
                    <GoogleFigures report={analytics} />
                </Deferred>
            )}

            <h2 className="text-h3 mt-10 mb-4">{text.blog.title}</h2>
            <div className="tablet:grid-cols-3 grid grid-cols-1 gap-4">
                <div className="border-grey-light rounded-md border px-5 py-4">
                    <p className="text-body-small text-grey-dark font-medium">
                        {text.blog.publishedArticles}
                    </p>
                    <p className="text-h2 mt-1">
                        {formatNumber(blog.publishedArticles)}
                    </p>
                </div>
                <div className="border-grey-light rounded-md border px-5 py-4">
                    <p className="text-body-small text-grey-dark font-medium">
                        {text.blog.confirmedSubscribers}
                    </p>
                    <p className="text-h2 mt-1">
                        {formatNumber(blog.confirmedSubscribers)}
                    </p>
                    <p className="text-meta mt-1 font-semibold text-green-700">
                        +{formatNumber(blog.newSubscribers)}{' '}
                        <span className="text-grey-dark font-normal">
                            {text.blog.newSubscribers}
                        </span>
                    </p>
                </div>
                <div className="border-grey-light rounded-md border px-5 py-4">
                    <p className="text-body-small text-grey-dark font-medium">
                        {text.blog.lastNewsletter}
                    </p>
                    {blog.lastNewsletter === null ? (
                        <p className="text-body-small text-grey-dark mt-2">
                            {text.blog.noNewsletter}
                        </p>
                    ) : (
                        <>
                            <p className="text-h4 mt-1">
                                « {blog.lastNewsletter.subject} »
                            </p>
                            <p className="text-meta text-grey-dark mt-1">
                                {text.blog.sentOn(
                                    blog.lastNewsletter.sentAt === null
                                        ? '—'
                                        : formatDay(
                                              blog.lastNewsletter.sentAt,
                                              {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                              },
                                          ),
                                    blog.lastNewsletter.recipients,
                                )}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

Analytics.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
