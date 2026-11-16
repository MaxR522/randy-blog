import { AnalyticsUnavailable } from '@/components/admin/analytics/analytics-unavailable';
import { BarList } from '@/components/admin/analytics/bar-list';
import { KpiTile } from '@/components/admin/analytics/kpi-tile';
import { LineChart } from '@/components/admin/analytics/line-chart';
import { Panel } from '@/components/admin/analytics/panel';
import { TopArticlesTable } from '@/components/admin/analytics/top-articles-table';
import type { AnalyticsFigures } from '@/helpers/analytics';
import { formatDuration, formatNumber } from '@/helpers/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics;

/**
 * The GA4 figures (ADM-ANA-3…5): four KPIs, the daily chart, the top articles and the shares; or the warning when
 * GA4 is unavailable.
 */
export function GoogleFigures({
    report,
}: {
    report: AnalyticsFigures | null | undefined;
}) {
    if (report === null || report === undefined) {
        return <AnalyticsUnavailable />;
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
                    <TopArticlesTable articles={report.topArticles} />
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
