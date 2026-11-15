import { useState } from 'react';
import { subscribers as searchSubscribers } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import type {
    PickedSubscriber,
    SubscriberPage,
} from '@/helpers/subscriber-picker';
import { usePickerRequest } from '@/hooks/use-picker-request';

/**
 * « Sélection » (ADM-SUB-25): the picker's opening, the ticked subscribers across searches and pages, and
 * `onConfirm` with them on « Valider ». Nothing changes until then.
 */
export function useSubscriberPicker(
    onConfirm: (selection: PickedSubscriber[]) => void,
) {
    const [isOpen, setIsOpen] = useState(false);
    const [picked, setPicked] = useState(
        () => new Map<number, PickedSubscriber>(),
    );
    const [query, setQuery] = useState('');
    const [page, setPage] = useState<SubscriberPage | null>(null);
    const request = usePickerRequest<SubscriberPage>();

    function load(search: string, pageNumber: number): void {
        setQuery(search);
        request.load(
            searchSubscribers.url({
                query: {
                    ...(search === '' ? {} : { q: search }),
                    ...(pageNumber > 1 ? { page: pageNumber } : {}),
                },
            }),
            setPage,
        );
    }

    function open(selection: PickedSubscriber[]): void {
        setPicked(
            new Map(selection.map((subscriber) => [subscriber.id, subscriber])),
        );
        setPage(null);
        setIsOpen(true);
        load('', 1);
    }

    function close(): void {
        request.cancel();
        setIsOpen(false);
    }

    function toggle(subscriber: PickedSubscriber, isChecked: boolean): void {
        setPicked((current) => {
            const next = new Map(current);

            if (isChecked) {
                next.set(subscriber.id, subscriber);
            } else {
                next.delete(subscriber.id);
            }

            return next;
        });
    }

    function confirm(): void {
        close();
        onConfirm([...picked.values()]);
    }

    return {
        isOpen,
        page,
        pickedCount: picked.size,
        isPicked: (id: number): boolean => picked.has(id),
        isLoading: request.isLoading,
        hasFailed: request.hasFailed,
        open,
        close,
        search: (search: string): void => load(search, 1),
        previousPage: (): void => load(query, (page?.currentPage ?? 1) - 1),
        nextPage: (): void => load(query, (page?.currentPage ?? 1) + 1),
        toggle,
        confirm,
    };
}

export type SubscriberPicker = ReturnType<typeof useSubscriberPicker>;
