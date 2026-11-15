import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ArticleDate } from '@/components/admin/articles/article-date';
import { ArticleStatusBadge } from '@/components/admin/articles/article-status-badge';
import type { ArticleRow } from '@/helpers/articles';
import { frenchTypography } from '@/helpers/typography';

type ArticleMobileCardProps = {
    article: ArticleRow;
    menu: ReactNode;
};

/**
 * An article of the list below 768 px: title, actions menu, status, date and categories.
 */
export function ArticleMobileCard({ article, menu }: ArticleMobileCardProps) {
    return (
        <div className="border-grey-light flex flex-col gap-2.5 rounded-md border px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
                <h2 className="text-body leading-[1.35] font-semibold">
                    <Link href={article.editUrl} className="text-primary">
                        {frenchTypography(article.title)}
                    </Link>
                </h2>
                <div className="-mt-2.5 -mr-3">{menu}</div>
            </div>
            <div className="text-grey-dark flex flex-wrap items-center gap-2 text-[0.8125rem] font-medium">
                <ArticleStatusBadge status={article.status} />
                <ArticleDate article={article} isShort />
            </div>
            {article.categories.length > 0 && (
                <p className="text-grey-dark text-[0.8125rem]">
                    {article.categories.join(', ')}
                </p>
            )}
        </div>
    );
}
