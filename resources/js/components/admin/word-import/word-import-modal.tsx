import { useId } from 'react';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { WordFileDropZone } from '@/components/admin/word-import/word-file-drop-zone';
import { WordFileRow } from '@/components/admin/word-import/word-file-row';
import { WordImportReport } from '@/components/admin/word-import/word-import-report';
import { Button } from '@/components/public/button';
import type { WordImport } from '@/hooks/use-word-import';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { WordImportResult } from '@/types/admin';

const text = adminLabels.wordImport;

type WordImportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** State and actions of the import, from `useWordImport` called by the page. */
    wordImport: WordImport;
    /** Whether the form already has a title, chapô or content, which the import replaces (ADM-ART-42). */
    hasContent: boolean;
    onImport: (fields: WordImportResult['fields']) => void;
};

/**
 * « Importer depuis Word » (ADM-ART-40…43): the .docx is converted in the browser, checked by the server against
 * the template's markers, and fills the form only once the author confirms. Nothing is saved.
 */
export function WordImportModal({
    isOpen,
    onClose,
    wordImport,
    hasContent,
    onImport,
}: WordImportModalProps) {
    const inputId = useId();
    const { step, file, result, isReady } = wordImport;
    const input = (
        <input
            id={inputId}
            type="file"
            data-autofocus
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={wordImport.chooseFile}
        />
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={text.title}>
            <ModalBody className="flex flex-col gap-4">
                <p className="text-grey-dark text-[0.9375rem] leading-[1.55]">
                    {text.intro}
                </p>

                {file === null ? (
                    <WordFileDropZone
                        inputId={inputId}
                        input={input}
                        onFile={wordImport.checkFile}
                    />
                ) : (
                    <WordFileRow
                        file={file}
                        inputId={inputId}
                        input={input}
                        canChange={step.name !== 'checking'}
                    />
                )}

                <WordImportReport step={step} hasContent={hasContent} />
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    {adminLabels.modal.cancel}
                </Button>
                <Button
                    disabled={!isReady}
                    onClick={() => {
                        if (isReady && result) {
                            onImport(result.fields);
                        }
                    }}
                >
                    {isReady && hasContent ? text.replace : text.submit}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
