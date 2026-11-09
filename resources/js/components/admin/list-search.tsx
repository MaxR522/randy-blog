import { router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { listUrl, listVisitOptions } from '@/lib/list-url';
import { cn } from '@/lib/utils';

const DEBOUNCE_MILLISECONDS = 300;

type ListSearchProps = {
    label: string;
    placeholder: string;
    /** The search in the URL. */
    value: string;
    className?: string;
};

/**
 * Search above a list, bound to `?q=` (ADM-COM-5). The input keeps its focus across visits.
 */
export function ListSearch({
    label,
    placeholder,
    value,
    className,
}: ListSearchProps) {
    const id = useId();
    const { url } = usePage();
    const [query, setQuery] = useState(value);
    const timeout = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timeout.current), []);

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const search = event.target.value;

        setQuery(search);
        window.clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => {
            router.get(
                listUrl(url, { q: search.trim() || null }),
                {},
                listVisitOptions,
            );
        }, DEBOUNCE_MILLISECONDS);
    }

    return (
        <div className={cn('relative', className)}>
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
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                className="border-grey-medium text-body text-primary focus:border-primary h-12 w-full rounded-md border bg-white pr-4 pl-10.5"
            />
        </div>
    );
}
