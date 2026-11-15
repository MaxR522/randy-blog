import { useHttp } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import type { WordImportStep } from '@/helpers/word-import';
import { documentHtml, isDocx, WORD_MAX_BYTES } from '@/helpers/word-import';
import { adminLabels } from '@/lib/labels.admin.fr';
import { importWord } from '@/routes/admin/articles';
import type { WordImportResult } from '@/types/admin';

const text = adminLabels.wordImport;

/**
 * « Importer depuis Word » (ADM-ART-40…43): the .docx is converted in the browser and checked by the server against
 * the template's markers. `reset()` starts again from an empty step and ignores a check still running.
 */
export function useWordImport() {
    const [step, setStep] = useState<WordImportStep>({ name: 'empty' });
    const generation = useRef(0);
    const http = useHttp<{ html: string }, WordImportResult>({ html: '' });

    async function check(file: File): Promise<void> {
        const current = ++generation.current;

        function show(next: WordImportStep): void {
            if (current === generation.current) {
                setStep(next);
            }
        }

        if (file.size > WORD_MAX_BYTES || !(await isDocx(file))) {
            show({ name: 'fileError', file, message: text.invalidFile });

            return;
        }

        show({ name: 'checking', file });

        let html: string;

        try {
            html = await documentHtml(file);
        } catch {
            show({ name: 'fileError', file, message: text.invalidFile });

            return;
        }

        if (current !== generation.current) {
            return;
        }

        http.transform(() => ({ html }));
        // The callbacks above handle every outcome; the returned promise only repeats them.
        http.post(importWord.url(), {
            onSuccess: (result) => show({ name: 'checked', file, result }),
            onError: (errors) =>
                show({
                    name: 'fileError',
                    file,
                    message: errors.html ?? text.invalidFile,
                }),
            onHttpException: () => {
                show({ name: 'fileError', file, message: text.checkFailed });

                return false;
            },
            onNetworkError: () => {
                show({ name: 'fileError', file, message: text.checkFailed });

                return false;
            },
        }).catch(() => undefined);
    }

    function checkFile(file: File | undefined): void {
        if (file) {
            void check(file);
        }
    }

    function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        event.target.value = '';
        checkFile(file);
    }

    function reset(): void {
        generation.current++;
        setStep({ name: 'empty' });
    }

    const result = step.name === 'checked' ? step.result : null;

    return {
        step,
        file: step.name === 'empty' ? null : step.file,
        result,
        isReady: result !== null && result.errors.length === 0,
        checkFile,
        chooseFile,
        reset,
    };
}

export type WordImport = ReturnType<typeof useWordImport>;
