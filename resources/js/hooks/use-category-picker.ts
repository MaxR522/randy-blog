import type { KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { CategoryPickerOption } from '@/helpers/category-picker';
import { categoryOptions } from '@/helpers/category-picker';
import type { CategoryOption } from '@/types/admin';

type CategoryPickerOptions = {
    categories: CategoryOption[];
    selectedIds: number[];
    newNames: string[];
    onChange: (selectedIds: number[], newNames: string[]) => void;
};

/**
 * Behaviour of the category combobox: the query, the open list and its active option, the keyboard
 * (arrows, Enter, Escape, Backspace on an empty query), choosing and removing categories.
 */
export function useCategoryPicker({
    categories,
    selectedIds,
    newNames,
    onChange,
}: CategoryPickerOptions) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const selected = categories.filter((category) =>
        selectedIds.includes(category.id),
    );

    const options = useMemo(
        () => categoryOptions(categories, selectedIds, newNames, query),
        [categories, newNames, query, selectedIds],
    );

    function changeQuery(value: string): void {
        setQuery(value);
        setActiveIndex(0);
        setIsOpen(true);
    }

    function choose(option: CategoryPickerOption): void {
        if (option.kind === 'existing') {
            onChange([...selectedIds, option.category.id], newNames);
        } else {
            onChange(selectedIds, [...newNames, option.name]);
        }

        setQuery('');
        setActiveIndex(0);
        inputRef.current?.focus();
    }

    function removeCategory(categoryId: number): void {
        onChange(
            selectedIds.filter((selectedId) => selectedId !== categoryId),
            newNames,
        );
    }

    function removeNewName(name: string): void {
        onChange(
            selectedIds,
            newNames.filter((newName) => newName !== name),
        );
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
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

    return {
        inputRef,
        query,
        activeIndex,
        options,
        selected,
        showList: isOpen && (options.length > 0 || query.trim() !== ''),
        changeQuery,
        open: (): void => setIsOpen(true),
        close: (): void => setIsOpen(false),
        choose,
        removeCategory,
        removeNewName,
        handleKeyDown,
    };
}
