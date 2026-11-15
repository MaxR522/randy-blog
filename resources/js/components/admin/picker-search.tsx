import { Search } from 'lucide-react';
import { useId } from 'react';
import { usePickerSearch } from '@/hooks/use-picker-search';

type PickerSearchProps = {
    label: string;
    placeholder: string;
    /** Called with the trimmed search, once the author stops typing. */
    onSearch: (query: string) => void;
};

/**
 * The search field of a picker modal. It takes the focus when the modal opens.
 */
export function PickerSearch({
    label,
    placeholder,
    onSearch,
}: PickerSearchProps) {
    const id = useId();
    const { query, changeQuery } = usePickerSearch(onSearch);

    return (
        <div className="relative">
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <Search
                aria-hidden="true"
                className="text-grey-medium pointer-events-none absolute top-3.75 left-3.5 size-4.5"
                strokeWidth={2}
            />
            <input
                id={id}
                type="search"
                data-autofocus
                value={query}
                placeholder={placeholder}
                onChange={(event) => changeQuery(event.target.value)}
                className="border-grey-medium text-body text-primary focus:border-primary h-12 w-full rounded-md border bg-white pr-4 pl-10.5"
            />
        </div>
    );
}
