import type { ArticleListItem } from '@/helpers/articles';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

type ArticleDateProps = {
    article: ArticleListItem;
    isShort: boolean;
};

/**
 * Publication date, or « Créé le … » for a draft, which has none yet.
 */
export function ArticleDate({ article, isShort }: ArticleDateProps) {
    if (article.status !== 'DRAFT' && article.publishedAt) {
        return (
            <time dateTime={article.publishedAt}>
                {isShort
                    ? article.publishedAtShortLabel
                    : article.publishedAtLabel}
            </time>
        );
    }

    const createdLabel = isShort
        ? article.createdAtShortLabel
        : article.createdAtLabel;

    return article.createdAt && createdLabel ? (
        <time dateTime={article.createdAt}>{text.createdOn(createdLabel)}</time>
    ) : null;
}
