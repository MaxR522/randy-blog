import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useId } from 'react';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';
import { search } from '@/routes';

type SearchBarProps = {
    defaultValue?: string;
    size?: 'large' | 'compact';
};

/**
 * Large search bar (home hero, 404) or compact one (results page: 48 px, icon square on mobile only,
 * Enter submits from tablet on). An empty query does nothing.
 */
export function SearchBar({
    defaultValue = '',
    size = 'large',
}: SearchBarProps) {
    const isCompact = size === 'compact';
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
            className={cn(
                'border-primary focus-within:outline-primary flex w-full items-center rounded-md border bg-white focus-within:outline-2 focus-within:outline-offset-2',
                isCompact ? 'h-12' : 'tablet:h-16 h-14',
            )}
        >
            <label htmlFor={inputId} className="sr-only">
                {labels.search.placeholder.replace('…', '')}
            </label>
            <Search
                aria-hidden="true"
                className={cn(
                    'text-grey-dark flex-none',
                    isCompact
                        ? 'ml-4 size-5'
                        : 'tablet:block ml-5 hidden size-5.5',
                )}
                strokeWidth={1.75}
            />
            <input
                id={inputId}
                name="q"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                defaultValue={defaultValue}
                placeholder={labels.search.placeholder}
                className={cn(
                    'text-body text-primary placeholder:text-grey-dark h-full min-w-0 flex-1 bg-transparent focus-visible:outline-none',
                    isCompact ? 'pl-2.5' : 'tablet:pl-3 tablet:text-lg pl-4',
                )}
            />
            <button
                type="submit"
                aria-label={labels.search.submit}
                className={cn(
                    'bg-primary text-button ease-standard hover:bg-primary-hover flex h-full flex-none items-center justify-center rounded-r-[3px] font-semibold text-white transition-colors duration-(--duration-base) focus-visible:-outline-offset-4 focus-visible:outline-white',
                    isCompact
                        ? 'tablet:hidden w-12'
                        : 'tablet:w-auto tablet:px-7 w-14',
                )}
            >
                <Search
                    aria-hidden="true"
                    className="tablet:hidden size-5"
                    strokeWidth={2}
                />
                {!isCompact && (
                    <span className="tablet:inline hidden">
                        {labels.search.submit}
                    </span>
                )}
            </button>
        </form>
    );
}
