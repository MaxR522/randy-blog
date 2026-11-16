import { EditorActions } from '@/components/admin/account/editor-actions';
import { TextField } from '@/components/admin/text-field';
import type { DisplayNameForm } from '@/hooks/use-display-name-form';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type DisplayNameEditorProps = {
    form: DisplayNameForm;
    onCancel: () => void;
};

/**
 * Inline editor of the display name.
 */
export function DisplayNameEditor({ form, onCancel }: DisplayNameEditorProps) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={form.submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <TextField
                label={text.displayName}
                name="display_name"
                value={form.value}
                onChange={(event) => form.change(event.target.value)}
                error={form.error}
                help={text.displayNameHelp}
                isLabelHidden
                maxLength={100}
                required
            />
            <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
        </form>
    );
}
