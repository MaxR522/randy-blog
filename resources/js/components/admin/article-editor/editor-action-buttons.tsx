import { Button } from '@/components/public/button';
import type { SubmitIntent } from '@/helpers/article-editor';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type EditorActionButtonsProps = {
    isPublished: boolean;
    processing: boolean;
    onSubmit: (intent: SubmitIntent) => void;
};

/**
 * Publish (until the article is published) and save, shown in the header, under the form and in the mobile bar.
 */
export function EditorActionButtons({
    isPublished,
    processing,
    onSubmit,
}: EditorActionButtonsProps) {
    return (
        <>
            {!isPublished && (
                <Button
                    variant="secondary"
                    disabled={processing}
                    onClick={() => onSubmit('publish')}
                >
                    {text.publish}
                </Button>
            )}
            <Button
                isLoading={processing}
                disabled={processing}
                onClick={() => onSubmit('save')}
            >
                {text.save}
            </Button>
        </>
    );
}
