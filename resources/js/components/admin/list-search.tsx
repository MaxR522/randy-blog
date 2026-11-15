import { Search } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type ListSearchProps = {
    label: string;
    placeholder: string;
    /** The typed search. */
    query: string;
    onQueryChange: (query: string) => void;
    className?: string;
};

/**
 * Search field above a list (ADM-COM-5); the page binds it to `?q=` through `useListSearch`.
 */
export function ListSearch({
    label,
    placeholder,
    query,
    onQueryChange,
    className,
}: ListSearchProps) {
    const id = useId();

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
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={placeholder}
                className="border-grey-medium text-body text-primary focus:border-primary h-12 w-full rounded-md border bg-white pr-4 pl-10.5"
            />
        </div>
    );
}
