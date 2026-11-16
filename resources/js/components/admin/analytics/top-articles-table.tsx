import { Link } from '@inertiajs/react';
import type { TopArticleRow } from '@/helpers/analytics';
import { formatNumber } from '@/helpers/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics;

/**
 * « Articles les plus lus »: rank, linked title, views; or the empty message.
 */
export function TopArticlesTable({ articles }: { articles: TopArticleRow[] }) {
    if (articles.length === 0) {
        return (
            <p className="text-body-small text-grey-dark">
                {text.topArticles.empty}
            </p>
        );
    }

    return (
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
                {articles.map((article, index) => (
                    <tr key={article.id}>
                        <td className="border-grey-light text-grey-dark border-b py-2.5">
                            {index + 1}
                        </td>
                        <td className="border-grey-light border-b py-2.5 pr-3">
                            <Link
                                href={article.editUrl}
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
    );
}
