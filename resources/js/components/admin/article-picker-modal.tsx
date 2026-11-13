import { useHttp } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { articles as searchArticles } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { PickerSearch } from '@/components/admin/picker-search';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { frenchTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';

const text = adminLabels.articlePicker;

/**
 * A published article as `NewsletterController::articles` lists it.
 */
export type PickedArticle = {
    id: number;
    title: string;
    dateLabel: string | null;
    thumbnail: string | null;
    chapo: string;
};

type ArticlePickerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (article: PickedArticle) => void;
};

/**
 * « Insérer un article » (ADM-SUB-21): search among the published articles and pick one. Full screen on phones.
 */
export function ArticlePickerModal({
    isOpen,
    onClose,
    onInsert,
}: ArticlePickerModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={text.title}>
            <PickerContent onClose={onClose} onInsert={onInsert} />
        </Modal>
    );
}

function PickerContent({
    onClose,
    onInsert,
}: Omit<ArticlePickerModalProps, 'isOpen'>) {
    const listId = useId();
    const [results, setResults] = useState<PickedArticle[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const http = useHttp<Record<string, never>, { data: PickedArticle[] }>({});

    function search(query: string): void {
        setHasFailed(false);
        http.get(
            searchArticles.url({ query: query === '' ? {} : { q: query } }),
            {
                onSuccess: (response) => {
                    setResults(response.data);
                    setSelectedId(response.data[0]?.id ?? null);
                },
                onHttpException: () => {
                    setHasFailed(true);

                    return false;
                },
                onNetworkError: () => {
                    setHasFailed(true);

                    return false;
                },
            },
        ).catch(() => undefined);
    }

    // The newest articles show before any search.
    useEffect(() => search(''), []);

    const selected = results.find((article) => article.id === selectedId);

    function moveSelection(event: KeyboardEvent<HTMLUListElement>): void {
        if (results.length === 0) {
            return;
        }

        const index = results.findIndex((article) => article.id === selectedId);
        const moves: Record<string, number> = {
            ArrowDown: Math.min(index + 1, results.length - 1),
            ArrowUp: Math.max(index - 1, 0),
            Home: 0,
            End: results.length - 1,
        };

        if (event.key === 'Enter' && selected) {
            event.preventDefault();
            onInsert(selected);

            return;
        }

        if (event.key in moves) {
            event.preventDefault();
            setSelectedId(results[moves[event.key]].id);
        }
    }

    return (
        <>
            <ModalBody className="flex flex-col gap-3">
                <PickerSearch
                    label={text.search}
                    placeholder={text.searchPlaceholder}
                    onSearch={search}
                />
                <p role="status" className="text-caption text-grey-dark">
                    {http.processing
                        ? text.loading
                        : hasFailed
                          ? text.failed
                          : results.length === 0
                            ? text.noMatch
                            : ''}
                </p>
                {results.length > 0 && (
                    <ul
                        id={listId}
                        role="listbox"
                        tabIndex={0}
                        aria-label={text.results}
                        aria-activedescendant={
                            selectedId === null
                                ? undefined
                                : `${listId}-${selectedId}`
                        }
                        onKeyDown={moveSelection}
                        className="border-grey-light border-t"
                    >
                        {results.map((article) => (
                            <li
                                key={article.id}
                                id={`${listId}-${article.id}`}
                                role="option"
                                aria-selected={article.id === selectedId}
                                onClick={() => setSelectedId(article.id)}
                                onDoubleClick={() => onInsert(article)}
                                className={cn(
                                    'border-grey-light flex cursor-pointer items-center gap-3 border-b py-2.5 pr-3 pl-2.5',
                                    article.id === selectedId
                                        ? 'bg-accent-50 shadow-[inset_3px_0_0_var(--color-accent-600)]'
                                        : 'hover:bg-grey-subtle',
                                )}
                            >
                                {article.thumbnail ? (
                                    <img
                                        src={article.thumbnail}
                                        alt=""
                                        className="aspect-card w-18 flex-none rounded-sm object-cover"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="aspect-card bg-grey-subtle w-18 flex-none rounded-sm"
                                    />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[0.9375rem] leading-[1.3] font-semibold">
                                        {frenchTypography(article.title)}
                                    </span>
                                    {article.dateLabel && (
                                        <span className="text-caption text-grey-dark">
                                            {article.dateLabel}
                                        </span>
                                    )}
                                </span>
                                {/* The colour is not the only cue (WCAG 1.4.1): the tick marks the chosen article too. */}
                                {article.id === selectedId && (
                                    <Check
                                        aria-hidden="true"
                                        className="text-accent-700 size-5 flex-none"
                                        strokeWidth={2}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    {text.cancel}
                </Button>
                <Button
                    disabled={!selected}
                    onClick={() => selected && onInsert(selected)}
                >
                    {text.insert}
                </Button>
            </ModalFooter>
        </>
    );
}
