import { EditorActions } from '@/components/admin/account/editor-actions';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import type { BiographyForm } from '@/hooks/use-biography-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type BiographyEditorProps = {
    form: BiographyForm;
    onCancel: () => void;
};

/**
 * Inline editor of the biography, with the minimal TinyMCE toolbar.
 */
export function BiographyEditor({ form, onCancel }: BiographyEditorProps) {
    return (
        <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
            <RichTextEditor
                label={text.biography}
                config="minimal"
                isLabelHidden
                value={form.value}
                onChange={form.change}
                error={form.error}
            />
            <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
        </form>
    );
}
