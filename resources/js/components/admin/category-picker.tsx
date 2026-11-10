import { Plus, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';
import { FieldError } from '@/components/admin/text-field';
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

type Option =
    | { kind: 'existing'; category: CategoryOption }
    | { kind: 'create'; name: string };

/**
 * Lowercase without accents, so « eco » finds « Économie ».
 */
function searchable(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

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
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const selected = categories.filter((category) =>
        selectedIds.includes(category.id),
    );

    const options = useMemo<Option[]>(() => {
        const needle = searchable(query);
        const matches = categories
            .filter((category) => !selectedIds.includes(category.id))
            .filter((category) => searchable(category.name).includes(needle))
            .map((category): Option => ({ kind: 'existing', category }));

        const name = query.trim().replace(/\s+/g, ' ');
        const isTaken =
            categories.some(
                (category) => searchable(category.name) === needle,
            ) || newNames.some((newName) => searchable(newName) === needle);

        return name !== '' && !isTaken
            ? [...matches, { kind: 'create', name }]
            : matches;
    }, [categories, newNames, query, selectedIds]);

    function choose(option: Option): void {
        if (option.kind === 'existing') {
            onChange([...selectedIds, option.category.id], newNames);
        } else {
            onChange(selectedIds, [...newNames, option.name]);
        }

        setQuery('');
        setActiveIndex(0);
        inputRef.current?.focus();
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) =>
                Math.min(index + 1, Math.max(options.length - 1, 0)),
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            // Never submit the whole article from this input.
            event.preventDefault();

            const option = options[activeIndex];

            if (isOpen && option) {
                choose(option);
            }
        } else if (event.key === 'Escape') {
            setIsOpen(false);
        } else if (event.key === 'Backspace' && query === '') {
            if (newNames.length > 0) {
                onChange(selectedIds, newNames.slice(0, -1));
            } else if (selectedIds.length > 0) {
                onChange(selectedIds.slice(0, -1), newNames);
            }
        }
    }

    const showList = isOpen && (options.length > 0 || query.trim() !== '');
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
                    {selected.map((category) => (
                        <Chip
                            key={category.id}
                            name={category.name}
                            onRemove={() =>
                                onChange(
                                    selectedIds.filter(
                                        (selectedId) =>
                                            selectedId !== category.id,
                                    ),
                                    newNames,
                                )
                            }
                        />
                    ))}
                    {newNames.map((name) => (
                        <Chip
                            key={`nouvelle-${name}`}
                            name={name}
                            onRemove={() =>
                                onChange(
                                    selectedIds,
                                    newNames.filter(
                                        (newName) => newName !== name,
                                    ),
                                )
                            }
                        />
                    ))}
                    <input
                        ref={inputRef}
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
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => setIsOpen(false)}
                        onKeyDown={onKeyDown}
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
                            onClick={() => choose(option)}
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

function Chip({ name, onRemove }: { name: string; onRemove: () => void }) {
    return (
        <span className="border-accent-200 bg-accent-50 text-accent-700 inline-flex h-7 items-center gap-0.5 rounded-sm border pl-2 text-xs font-semibold">
            {name}
            <button
                type="button"
                onClick={onRemove}
                aria-label={text.removeCategory(name)}
                className="hover:bg-accent-100 relative inline-flex size-7 items-center justify-center rounded-sm after:absolute after:-inset-2"
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </span>
    );
}
