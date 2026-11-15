import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/helpers/categories';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.categories;

type CategoryMobileRowProps = {
    category: Category;
    onEdit: () => void;
    onDelete: () => void;
};

/**
 * A category on a phone: its name, its article count and date, and the edit and delete icon buttons.
 */
export function CategoryMobileRow({
    category,
    onEdit,
    onDelete,
}: CategoryMobileRowProps) {
    const iconButtonClasses =
        'flex size-11 flex-none cursor-pointer items-center justify-center rounded-md';

    return (
        <div className="border-grey-light flex items-center gap-2 border-b py-2.5">
            <div className="min-w-0 flex-1">
                <p className="text-body font-semibold">{category.name}</p>
                <p className="text-grey-dark mt-0.5 text-[0.8125rem]">
                    {text.mobileMeta(
                        category.articlesCount,
                        category.createdAtShortLabel,
                    )}
                </p>
            </div>
            <button
                type="button"
                onClick={onEdit}
                aria-label={text.editNamed(category.name)}
                className={`text-primary ${iconButtonClasses}`}
            >
                <Pencil
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
            </button>
            <button
                type="button"
                onClick={onDelete}
                aria-label={text.deleteNamed(category.name)}
                className={`text-red-700 ${iconButtonClasses}`}
            >
                <Trash2
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
            </button>
        </div>
    );
}
