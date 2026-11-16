import { lastNewsletterDateOf } from '@/helpers/analytics';
import { formatNumber } from '@/helpers/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AnalyticsBlog } from '@/types/admin';

const text = adminLabels.analytics;

/**
 * The blog figures from the database (ADM-ANA-6): published articles, confirmed subscribers, last newsletter.
 */
export function BlogFigures({ blog }: { blog: AnalyticsBlog }) {
    return (
        <>
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
                                    lastNewsletterDateOf(blog.lastNewsletter),
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
