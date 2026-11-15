import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TextField } from '@/components/admin/text-field';
import { NEWSLETTER_FIELD_MAX_LENGTH } from '@/helpers/newsletter-editor';
import type { NewsletterEditorForm } from '@/hooks/use-newsletter-editor-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletterEditor;

type NewsletterFieldsProps = {
    editor: NewsletterEditorForm;
};

/**
 * The audience error, subject, preheader and content of the newsletter, in the main column.
 */
export function NewsletterFields({ editor }: NewsletterFieldsProps) {
    const { data, errors } = editor;

    return (
        <div className="tablet:gap-7 flex min-w-0 flex-col gap-5">
            {errors.audience && (
                <p
                    role="alert"
                    className="text-body-small rounded-md border border-red-600 bg-red-50 px-4 py-3 font-medium text-red-700"
                >
                    {errors.audience}
                </p>
            )}
            <TextField
                label={text.subject}
                name="subject"
                value={data.subject}
                maxLength={NEWSLETTER_FIELD_MAX_LENGTH}
                error={errors.subject}
                help={text.count(data.subject.length)}
                onChange={(event) => editor.changeSubject(event.target.value)}
            />
            <TextField
                label={`${text.preheader} ${text.optional}`}
                name="preheader"
                value={data.preheader}
                maxLength={NEWSLETTER_FIELD_MAX_LENGTH}
                error={errors.preheader}
                help={text.preheaderHelp(data.preheader.length)}
                onChange={(event) => editor.changePreheader(event.target.value)}
            />
            <RichTextEditor
                label={text.content}
                config="newsletter"
                value={data.content}
                onChange={editor.changeContent}
                onNormalize={editor.normalizeContent}
                error={errors.content}
                help={text.contentHelp}
                toolbarButtons={editor.toolbarButtons}
            />
        </div>
    );
}
