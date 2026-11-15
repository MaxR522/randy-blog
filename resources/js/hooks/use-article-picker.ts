import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { articles as searchArticles } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import type { PickedArticle } from '@/helpers/article-picker';
import { selectionMoveOf } from '@/helpers/article-picker';
import { usePickerRequest } from '@/hooks/use-picker-request';

/**
 * « Insérer un article » (ADM-SUB-21): the picker's opening, the search among the published articles, the chosen
 * one, the listbox keys, and `onInsert` with the article once picked. The newest articles show before any search.
 */
export function useArticlePicker(onInsert: (article: PickedArticle) => void) {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<PickedArticle[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const request = usePickerRequest<{ data: PickedArticle[] }>();
    const selected = results.find((article) => article.id === selectedId);

    function search(query: string): void {
        request.load(
            searchArticles.url({ query: query === '' ? {} : { q: query } }),
            (response) => {
                setResults(response.data);
                setSelectedId(response.data[0]?.id ?? null);
            },
        );
    }

    function open(): void {
        setResults([]);
        setSelectedId(null);
        setIsOpen(true);
        search('');
    }

    function close(): void {
        request.cancel();
        setIsOpen(false);
    }

    function insert(article: PickedArticle): void {
        close();
        onInsert(article);
    }

    function moveSelection(event: KeyboardEvent<HTMLUListElement>): void {
        if (results.length === 0) {
            return;
        }

        if (event.key === 'Enter' && selected) {
            event.preventDefault();
            insert(selected);

            return;
        }

        const index = results.findIndex((article) => article.id === selectedId);
        const next = selectionMoveOf(event.key, index, results.length);

        if (next !== null) {
            event.preventDefault();
            setSelectedId(results[next].id);
        }
    }

    return {
        isOpen,
        results,
        selectedId,
        selected,
        isLoading: request.isLoading,
        hasFailed: request.hasFailed,
        open,
        close,
        search,
        select: setSelectedId,
        insert,
        moveSelection,
    };
}

export type ArticlePicker = ReturnType<typeof useArticlePicker>;
