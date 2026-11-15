import type { CategoryOption } from '@/types/admin';

/** An option of the category combobox: an existing category, or the typed name to create. */
export type CategoryPickerOption =
    | { kind: 'existing'; category: CategoryOption }
    | { kind: 'create'; name: string };

/**
 * Lowercase without accents, so « eco » finds « Économie ».
 */
export function searchable(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

/**
 * The categories not chosen yet that match the query, then « Créer » for the typed name when no category,
 * existing or new, has it already.
 */
export function categoryOptions(
    categories: CategoryOption[],
    selectedIds: number[],
    newNames: string[],
    query: string,
): CategoryPickerOption[] {
    const needle = searchable(query);
    const matches = categories
        .filter((category) => !selectedIds.includes(category.id))
        .filter((category) => searchable(category.name).includes(needle))
        .map((category): CategoryPickerOption => ({
            kind: 'existing',
            category,
        }));

    const name = query.trim().replace(/\s+/g, ' ');
    const isTaken =
        categories.some((category) => searchable(category.name) === needle) ||
        newNames.some((newName) => searchable(newName) === needle);

    return name !== '' && !isTaken
        ? [...matches, { kind: 'create', name }]
        : matches;
}
