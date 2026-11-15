import { FieldError } from '@/components/admin/text-field';
import { AudienceOption } from '@/components/admin/newsletter-editor/audience-option';
import { Button } from '@/components/public/button';
import type { NewsletterEditorForm } from '@/hooks/use-newsletter-editor-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletterEditor;

type RecipientsPanelProps = {
    editor: NewsletterEditorForm;
    confirmedCount: number;
    /** The author's login email, plus the verified recovery email. */
    testEmails: string[];
};

/**
 * The side column: all subscribers or a selection, the recipient total, and where the test goes.
 */
export function RecipientsPanel({
    editor,
    confirmedCount,
    testEmails,
}: RecipientsPanelProps) {
    const { data, selection, selectionError, recipientCount } = editor;

    return (
        <div className="flex flex-col gap-4">
            <fieldset className="border-grey-light flex flex-col gap-3 rounded-md border p-4">
                <legend className="text-overline text-grey-dark px-1.5 font-semibold uppercase">
                    {text.recipients}
                </legend>
                <AudienceOption
                    checked={data.audience === 'all'}
                    onChange={() => editor.changeAudience('all')}
                    label={text.allSubscribers}
                    help={text.subscriberCount(confirmedCount)}
                />
                <AudienceOption
                    checked={data.audience === 'selection'}
                    onChange={() => editor.changeAudience('selection')}
                    label={text.selection}
                    help={
                        data.audience === 'selection'
                            ? text.selectedCount(selection.length)
                            : text.selectionHelp
                    }
                />
                {data.audience === 'selection' && (
                    <Button
                        variant="secondary"
                        onClick={editor.openSubscriberPicker}
                        className="self-start"
                    >
                        {text.chooseSubscribers}
                    </Button>
                )}
                {selectionError && (
                    <FieldError id="selection-erreur">
                        {selectionError}
                    </FieldError>
                )}
                <p
                    aria-live="polite"
                    className="border-grey-light tablet:block text-body-small hidden border-t pt-3"
                >
                    <span className="font-semibold">
                        {text.recipientTotal(recipientCount)}
                    </span>
                </p>
            </fieldset>
            <div className="border-grey-light tablet:block hidden rounded-md border p-4">
                <p className="text-overline text-grey-dark mb-1.5 font-semibold uppercase">
                    {text.test}
                </p>
                <p className="text-body-small text-grey-dark">
                    {text.testHelp(testEmails)}
                </p>
            </div>
        </div>
    );
}
