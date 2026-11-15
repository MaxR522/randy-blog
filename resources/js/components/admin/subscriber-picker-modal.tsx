import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { PickerSearch } from '@/components/admin/picker-search';
import { Button } from '@/components/public/button';
import type { SubscriberPicker } from '@/hooks/use-subscriber-picker';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriberPicker;

type SubscriberPickerModalProps = {
    picker: SubscriberPicker;
};

/**
 * « Sélection » (ADM-SUB-25): tick confirmed subscribers, across searches and pages. Nothing changes until « Valider ».
 */
export function SubscriberPickerModal({ picker }: SubscriberPickerModalProps) {
    return (
        <Modal isOpen={picker.isOpen} onClose={picker.close} title={text.title}>
            <PickerContent picker={picker} />
        </Modal>
    );
}

function PickerContent({ picker }: SubscriberPickerModalProps) {
    const { page } = picker;

    return (
        <>
            <ModalBody className="flex flex-col gap-3">
                <PickerSearch
                    label={text.search}
                    placeholder={text.searchPlaceholder}
                    onSearch={picker.search}
                />
                <p
                    role="status"
                    className="text-body-small text-primary font-semibold"
                >
                    {text.selectedCount(picker.pickedCount)}
                </p>
                <p role="status" className="text-caption text-grey-dark">
                    {picker.isLoading
                        ? text.loading
                        : picker.hasFailed
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
                                            checked={picker.isPicked(
                                                subscriber.id,
                                            )}
                                            onChange={(event) =>
                                                picker.toggle(
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
                            disabled={page.currentPage <= 1 || picker.isLoading}
                            onClick={picker.previousPage}
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
                                picker.isLoading
                            }
                            onClick={picker.nextPage}
                        >
                            {text.next}
                        </Button>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={picker.close}>
                    {text.cancel}
                </Button>
                <Button onClick={picker.confirm}>{text.confirm}</Button>
            </ModalFooter>
        </>
    );
}
