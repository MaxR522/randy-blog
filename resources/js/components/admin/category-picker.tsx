import { Plus } from 'lucide-react';
import { useId } from 'react';
import { CategoryChip } from '@/components/admin/category-chip';
import { FieldError } from '@/components/admin/text-field';
import { useCategoryPicker } from '@/hooks/use-category-picker';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import type { CategoryOption } from '@/types/admin';

const text = adminLabels.editor;

type CategoryPickerProps = {
    categories: CategoryOption[];
    selectedIds: number[];
    /** Names typed in the picker, created when the article is saved. */
    newNames: string[];
    onChange: (selectedIds: number[], newNames: string[]) => void;
    error?: string;
};

/**
 * « Catégories » of the editor (ADM-ART-25): chips for the chosen categories and a combobox to search them,
 * whose last option creates the typed name when no category has it.
 */
export function CategoryPicker({
    categories,
    selectedIds,
    newNames,
    onChange,
    error,
}: CategoryPickerProps) {
    const id = useId();
    const inputId = `${id}-saisie`;
    const listId = `${id}-liste`;
    const errorId = `${id}-erreur`;
    const picker = useCategoryPicker({
        categories,
        selectedIds,
        newNames,
        onChange,
    });
    const { options, activeIndex, showList } = picker;
    const activeId =
        showList && options[activeIndex]
            ? `${listId}-${activeIndex}`
            : undefined;

    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={inputId}
                className="text-body-small text-primary font-semibold"
            >
                {text.categories}
            </label>
            <div className="relative">
                <div
                    className={cn(
                        'border-grey-medium focus-within:border-primary flex min-h-12 flex-wrap items-center gap-1.5 rounded-md border bg-white px-3 py-2',
                        error && 'border-red-600 ring-1 ring-red-600',
                    )}
                >
                    {picker.selected.map((category) => (
                        <CategoryChip
                            key={category.id}
                            name={category.name}
                            onRemove={() => picker.removeCategory(category.id)}
                        />
                    ))}
                    {newNames.map((name) => (
                        <CategoryChip
                            key={`nouvelle-${name}`}
                            name={name}
                            onRemove={() => picker.removeNewName(name)}
                        />
                    ))}
                    <input
                        ref={picker.inputRef}
                        id={inputId}
                        type="text"
                        role="combobox"
                        aria-expanded={showList}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeId}
                        aria-invalid={Boolean(error) || undefined}
                        aria-describedby={error ? errorId : undefined}
                        autoComplete="off"
                        placeholder={text.categoriesPlaceholder}
                        value={picker.query}
                        onChange={(event) =>
                            picker.changeQuery(event.target.value)
                        }
                        onFocus={picker.open}
                        onBlur={picker.close}
                        onKeyDown={picker.handleKeyDown}
                        className="text-body h-8 min-w-25 flex-1 border-0 bg-transparent p-0 focus:ring-0 focus:outline-none"
                    />
                </div>
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={text.categories}
                    hidden={!showList}
                    className="border-grey-light absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border bg-white py-1 shadow-lg"
                >
                    {options.length === 0 && (
                        <li className="text-body-small text-grey-dark px-4 py-3">
                            {text.noCategoryMatch}
                        </li>
                    )}
                    {options.map((option, index) => (
                        <li
                            key={
                                option.kind === 'existing'
                                    ? option.category.id
                                    : 'creer'
                            }
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            // Keep the input focused, or its blur closes the list before the click lands.
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => picker.choose(option)}
                            className={cn(
                                'text-body flex min-h-11 cursor-pointer items-center gap-2 px-4',
                                index === activeIndex && 'bg-grey-subtle',
                                option.kind === 'create' &&
                                    'text-accent-700 font-medium',
                            )}
                        >
                            {option.kind === 'existing' ? (
                                option.category.name
                            ) : (
                                <>
                                    <Plus
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    {text.createCategory(option.name)}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </div>
    );
}
