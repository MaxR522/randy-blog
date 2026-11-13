import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

const DEBOUNCE_MILLISECONDS = 300;

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
    const [query, setQuery] = useState('');
    const timeout = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timeout.current), []);

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
                onChange={(event) => {
                    const search = event.target.value;

                    setQuery(search);
                    window.clearTimeout(timeout.current);
                    timeout.current = window.setTimeout(
                        () => onSearch(search.trim()),
                        DEBOUNCE_MILLISECONDS,
                    );
                }}
                className="border-grey-medium text-body text-primary focus:border-primary h-12 w-full rounded-md border bg-white pr-4 pl-10.5"
            />
        </div>
    );
}
