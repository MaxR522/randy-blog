import { CategoryMobileRow } from '@/components/admin/categories/category-mobile-row';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/public/button';
import type { Category, CategorySort, ColumnSort } from '@/helpers/categories';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.categories;

type CategoriesTableProps = {
    categories: Category[];
    sortOf: (sort: CategorySort) => ColumnSort;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
};

/**
 * The categories as a table on wider screens and as rows on phones, with the sortable name and date columns.
 */
export function CategoriesTable({
    categories,
    sortOf,
    onEdit,
    onDelete,
}: CategoriesTableProps) {
    const columns: DataTableColumn<Category>[] = [
        {
            key: 'name',
            header: text.columns.name,
            cellClassName: 'font-medium',
            sort: sortOf('name'),
            render: (category) => category.name,
        },
        {
            key: 'date',
            header: text.columns.date,
            cellClassName: 'text-grey-dark',
            sort: sortOf('date'),
            render: (category) =>
                category.createdAt && (
                    <time dateTime={category.createdAt}>
                        {category.createdAtLabel}
                    </time>
                ),
        },
        {
            key: 'articles',
            header: text.columns.articles,
            alignEnd: true,
            isNumeric: true,
            render: (category) => category.articlesCount,
        },
        {
            key: 'actions',
            header: text.columns.actions,
            alignEnd: true,
            cellClassName: 'whitespace-nowrap',
            render: (category) => (
                <>
                    <Button
                        variant="ghost"
                        onClick={() => onEdit(category)}
                        aria-label={text.editNamed(category.name)}
                        className="h-10 px-3 text-sm"
                    >
                        {text.edit}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onDelete(category)}
                        aria-label={text.deleteNamed(category.name)}
                        className="h-10 px-3 text-sm text-red-700"
                    >
                        {text.delete}
                    </Button>
                </>
            ),
        },
    ];

    return (
        <DataTable
            caption={text.title}
            columns={columns}
            rows={categories}
            rowKey={(category) => category.id}
            renderMobileItem={(category) => (
                <CategoryMobileRow
                    category={category}
                    onEdit={() => onEdit(category)}
                    onDelete={() => onDelete(category)}
                />
            )}
        />
    );
}
