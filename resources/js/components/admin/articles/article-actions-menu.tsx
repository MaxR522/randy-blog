import { RowActionsMenu } from '@/components/admin/row-actions-menu/row-actions-menu';
import type { ArticleRow } from '@/helpers/articles';
import type { RowAction } from '@/helpers/row-actions-menu';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

type ArticleActionsMenuProps = {
    article: ArticleRow;
    actions: RowAction[];
};

/**
 * Kebab menu of an article row, named after its title.
 */
export function ArticleActionsMenu({
    article,
    actions,
}: ArticleActionsMenuProps) {
    return (
        <RowActionsMenu
            triggerLabel={text.actionsFor(article.title)}
            menuLabel={text.actionsMenu}
            title={article.title}
            actions={actions}
        />
    );
}
