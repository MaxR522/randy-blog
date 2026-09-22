import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useId } from 'react';
import { labels } from '@/lib/labels.fr';
import { search } from '@/routes';

type SearchBarProps = {
    defaultValue?: string;
};

/**
 * Large search bar (home hero, 404). An empty query does nothing.
 */
export function SearchBar({ defaultValue = '' }: SearchBarProps) {
    const inputId = useId();

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = new FormData(event.currentTarget).get('q');
        const query = typeof value === 'string' ? value.trim() : '';

        if (query !== '') {
            router.visit(search({ query: { q: query } }));
        }
    };

    return (
        <form
            role="search"
            action={search.url()}
            method="get"
            onSubmit={submit}
            className="border-primary focus-within:outline-primary tablet:h-16 flex h-14 w-full items-center rounded-md border bg-white focus-within:outline-2 focus-within:outline-offset-2"
        >
            <label htmlFor={inputId} className="sr-only">
                {labels.search.placeholder.replace('…', '')}
            </label>
            <Search
                aria-hidden="true"
                className="text-grey-dark tablet:block ml-5 hidden size-5.5 flex-none"
                strokeWidth={1.75}
            />
            <input
                id={inputId}
                name="q"
                type="search"
                defaultValue={defaultValue}
                placeholder={labels.search.placeholder}
                className="text-body text-primary placeholder:text-grey-dark tablet:pl-3 tablet:text-lg h-full min-w-0 flex-1 bg-transparent pl-4 focus-visible:outline-none"
            />
            <button
                type="submit"
                aria-label={labels.search.submit}
                className="bg-primary text-button ease-standard hover:bg-primary-hover tablet:w-auto tablet:px-7 flex h-full w-14 flex-none items-center justify-center rounded-r-[3px] font-semibold text-white transition-colors duration-(--duration-base) focus-visible:outline-offset-[-4px] focus-visible:outline-white"
            >
                <Search
                    aria-hidden="true"
                    className="tablet:hidden size-5"
                    strokeWidth={2}
                />
                <span className="tablet:inline hidden">
                    {labels.search.submit}
                </span>
            </button>
        </form>
    );
}
