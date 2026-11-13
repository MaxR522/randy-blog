import { lazy, Suspense, useId } from 'react';
import { FieldError } from '@/components/admin/text-field';
import type { ToolbarButton } from '@/components/admin/tinymce-editor';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { RichTextConfig, UploadFolder } from '@/lib/tinymce-configs';
import { cn } from '@/lib/utils';

/** TinyMCE weighs several hundred kilobytes: only pages with an editor download it. */
const TinyMCEEditor = lazy(() => import('@/components/admin/tinymce-editor'));

type RichTextEditorProps = {
    label: string;
    config: RichTextConfig;
    value: string;
    onChange: (html: string) => void;
    error?: string;
    help?: string;
    uploadFolder?: UploadFolder;
    placeholder?: string;
    /** For a field whose label is already shown next to it, such as an inline editor. */
    isLabelHidden?: boolean;
    toolbarButtons?: ToolbarButton[];
    onNormalize?: (html: string) => void;
};

/**
 * Labelled TinyMCE field with help text and an inline error, in the admin's input frame.
 */
export function RichTextEditor({
    label,
    config,
    value,
    onChange,
    error,
    help,
    uploadFolder,
    placeholder,
    isLabelHidden = false,
    toolbarButtons,
    onNormalize,
}: RichTextEditorProps) {
    const id = useId();
    const labelId = `${id}-libelle`;
    const helpId = `${id}-aide`;
    const errorId = `${id}-erreur`;
    const description = [help, error].filter(Boolean).join(' ') || undefined;

    return (
        <div className="flex flex-col gap-2">
            <span
                id={labelId}
                className={cn(
                    'text-body-small text-primary font-semibold',
                    isLabelHidden && 'sr-only',
                )}
            >
                {label}
            </span>
            <div
                role="group"
                aria-labelledby={labelId}
                className={cn('rich-text-editor', error && 'is-invalid')}
            >
                <Suspense
                    fallback={
                        <div
                            role="status"
                            className={cn(
                                'border-grey-medium bg-grey-subtle text-body-small text-grey-dark flex items-center justify-center rounded-md border motion-safe:animate-pulse',
                                config === 'minimal' ? 'h-36' : 'h-150',
                            )}
                        >
                            {adminLabels.richText.loading}
                        </div>
                    }
                >
                    <TinyMCEEditor
                        config={config}
                        value={value}
                        onChange={onChange}
                        labelId={labelId}
                        description={description}
                        isInvalid={Boolean(error)}
                        uploadFolder={uploadFolder}
                        placeholder={placeholder}
                        toolbarButtons={toolbarButtons}
                        onNormalize={onNormalize}
                    />
                </Suspense>
            </div>
            {help && (
                <p id={helpId} className="text-caption text-grey-dark">
                    {help}
                </p>
            )}
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </div>
    );
}
