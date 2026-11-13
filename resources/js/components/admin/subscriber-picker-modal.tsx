import { useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { subscribers as searchSubscribers } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { PickerSearch } from '@/components/admin/picker-search';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriberPicker;

export type PickedSubscriber = { id: number; email: string };

type SubscriberPage = {
    data: PickedSubscriber[];
    total: number;
    currentPage: number;
    lastPage: number;
};

type SubscriberPickerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    selection: PickedSubscriber[];
    onConfirm: (selection: PickedSubscriber[]) => void;
};

/**
 * « Sélection » (ADM-SUB-25): tick confirmed subscribers, across searches and pages. Nothing changes until « Valider ».
 */
export function SubscriberPickerModal({
    isOpen,
    onClose,
    selection,
    onConfirm,
}: SubscriberPickerModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={text.title}>
            <PickerContent
                onClose={onClose}
                selection={selection}
                onConfirm={onConfirm}
            />
        </Modal>
    );
}

function PickerContent({
    onClose,
    selection,
    onConfirm,
}: Omit<SubscriberPickerModalProps, 'isOpen'>) {
    const [picked, setPicked] = useState(
        () =>
            new Map(selection.map((subscriber) => [subscriber.id, subscriber])),
    );
    const [query, setQuery] = useState('');
    const [page, setPage] = useState<SubscriberPage | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const http = useHttp<Record<string, never>, SubscriberPage>({});

    function load(search: string, pageNumber: number): void {
        setQuery(search);
        setHasFailed(false);
        http.get(
            searchSubscribers.url({
                query: {
                    ...(search === '' ? {} : { q: search }),
                    ...(pageNumber > 1 ? { page: pageNumber } : {}),
                },
            }),
            {
                onSuccess: setPage,
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

    useEffect(() => load('', 1), []);

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

    return (
        <>
            <ModalBody className="flex flex-col gap-3">
                <PickerSearch
                    label={text.search}
                    placeholder={text.searchPlaceholder}
                    onSearch={(search) => load(search, 1)}
                />
                <p
                    role="status"
                    className="text-body-small text-primary font-semibold"
                >
                    {text.selectedCount(picked.size)}
                </p>
                <p role="status" className="text-caption text-grey-dark">
                    {http.processing
                        ? text.loading
                        : hasFailed
                          ? text.failed
                          : page?.data.length === 0
                            ? text.noMatch
                            : ''}
                </p>
                {page && page.data.length > 0 && (
                    <fieldset>
                        <legend className="sr-only">{text.results}</legend>
                        <ul className="border-grey-light border-t">
                            {page.data.map((subscriber) => (
                                <li
                                    key={subscriber.id}
                                    className="border-grey-light border-b"
                                >
                                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1.5 py-1.5 text-[0.9375rem]">
                                        <input
                                            type="checkbox"
                                            checked={picked.has(subscriber.id)}
                                            onChange={(event) =>
                                                toggle(
                                                    subscriber,
                                                    event.target.checked,
                                                )
                                            }
                                            className="accent-primary size-5 flex-none"
                                        />
                                        <span className="min-w-0 break-all">
                                            {subscriber.email}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </fieldset>
                )}
                {page && page.lastPage > 1 && (
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="secondary"
                            disabled={page.currentPage <= 1 || http.processing}
                            onClick={() => load(query, page.currentPage - 1)}
                        >
                            {text.previous}
                        </Button>
                        <span className="text-body-small text-grey-dark font-medium">
                            {text.page(page.currentPage, page.lastPage)}
                        </span>
                        <Button
                            variant="secondary"
                            disabled={
                                page.currentPage >= page.lastPage ||
                                http.processing
                            }
                            onClick={() => load(query, page.currentPage + 1)}
                        >
                            {text.next}
                        </Button>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    {text.cancel}
                </Button>
                <Button onClick={() => onConfirm([...picked.values()])}>
                    {text.confirm}
                </Button>
            </ModalFooter>
        </>
    );
}
