import { Check } from 'lucide-react';
import { useId } from 'react';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { PickerSearch } from '@/components/admin/picker-search';
import { Button } from '@/components/public/button';
import { frenchTypography } from '@/helpers/typography';
import type { ArticlePicker } from '@/hooks/use-article-picker';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.articlePicker;

type ArticlePickerModalProps = {
    picker: ArticlePicker;
};

/**
 * « Insérer un article » (ADM-SUB-21): search among the published articles and pick one. Full screen on phones.
 */
export function ArticlePickerModal({ picker }: ArticlePickerModalProps) {
    return (
        <Modal isOpen={picker.isOpen} onClose={picker.close} title={text.title}>
            <PickerContent picker={picker} />
        </Modal>
    );
}

function PickerContent({ picker }: ArticlePickerModalProps) {
    const listId = useId();
    const { results, selectedId, selected } = picker;

    return (
        <>
            <ModalBody className="flex flex-col gap-3">
                <PickerSearch
                    label={text.search}
                    placeholder={text.searchPlaceholder}
                    onSearch={picker.search}
                />
                <p role="status" className="text-caption text-grey-dark">
                    {picker.isLoading
                        ? text.loading
                        : picker.hasFailed
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
                        onKeyDown={picker.moveSelection}
                        className="border-grey-light border-t"
                    >
                        {results.map((article) => (
                            <li
                                key={article.id}
                                id={`${listId}-${article.id}`}
                                role="option"
                                aria-selected={article.id === selectedId}
                                onClick={() => picker.select(article.id)}
                                onDoubleClick={() => picker.insert(article)}
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
                <Button variant="secondary" onClick={picker.close}>
                    {text.cancel}
                </Button>
                <Button
                    disabled={!selected}
                    onClick={() => selected && picker.insert(selected)}
                >
                    {text.insert}
                </Button>
            </ModalFooter>
        </>
    );
}
