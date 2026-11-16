import { formatDay } from '@/helpers/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';
import { edit } from '@/routes/admin/articles';
import type { AnalyticsBlog, AnalyticsReport } from '@/types/admin';

const text = adminLabels.analytics;

/** The periods of the picker, in days (same list as `AnalyticsPeriod`). */
export const PERIODS = [7, 28, 90];

/** One row of « Articles les plus lus », with the link to its editor. */
export type TopArticleRow = AnalyticsReport['topArticles'][number] & {
    editUrl: string;
};

/** The GA4 report with the editor links of its top articles. */
export type AnalyticsFigures = Omit<AnalyticsReport, 'topArticles'> & {
    topArticles: TopArticleRow[];
};

/** Adds the editor link to each top article; `null` or missing stays as it is (GA4 unavailable or still loading). */
export function analyticsFiguresOf(
    report: AnalyticsReport | null | undefined,
): AnalyticsFigures | null | undefined {
    if (report === null || report === undefined) {
        return report;
    }

    return {
        ...report,
        topArticles: report.topArticles.map((article) => ({
            ...article,
            editUrl: edit.url(article.id),
        })),
    };
}

/** « 20 octobre – 16 novembre 2026, comparé aux 28 jours précédents ». */
export function analyticsCaptionOf(
    range: { start: string; end: string },
    period: number,
): string {
    const day = { day: 'numeric', month: 'long' } as const;

    return `${formatDay(range.start, day)} – ${formatDay(range.end, { ...day, year: 'numeric' })}, ${text.comparedWith(period)}`;
}

/** The send date of the last newsletter, or « — » when it has none. */
export function lastNewsletterDateOf(
    newsletter: NonNullable<AnalyticsBlog['lastNewsletter']>,
): string {
    return newsletter.sentAt === null
        ? '—'
        : formatDay(newsletter.sentAt, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          });
}
