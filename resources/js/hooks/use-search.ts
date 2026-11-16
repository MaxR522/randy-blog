import { router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { search } from '@/routes';

/**
 * The search form of the home hero, the results page and the 404: a real GET form to `/recherche` (works without
 * JavaScript), visited through Inertia once hydrated. An empty query does nothing.
 */
export function useSearch() {
    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const value = new FormData(event.currentTarget).get('q');
        const query = typeof value === 'string' ? value.trim() : '';

        if (query !== '') {
            router.visit(search({ query: { q: query } }));
        }
    }

    return { action: search.url(), submit };
}

export type SearchForm = ReturnType<typeof useSearch>;
