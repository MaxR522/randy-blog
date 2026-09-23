import type { ArticleCategory } from '@/types';
import { cn } from '@/lib/utils';

type CategoryChipsProps = {
    categories: ArticleCategory[];
    className?: string;
};

export function CategoryChips({ categories, className }: CategoryChipsProps) {
    if (categories.length === 0) {
        return null;
    }

    return (
        <ul role="list" className={cn('flex flex-wrap gap-1.5', className)}>
            {categories.map((category) => (
                <li
                    key={category.id}
                    className="bg-accent-50 text-overline text-accent-700 inline-flex h-6 items-center rounded-sm px-2 font-semibold whitespace-nowrap uppercase"
                >
                    {category.name}
                </li>
            ))}
        </ul>
    );
}
