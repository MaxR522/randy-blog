import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { AdminHead } from '@/components/admin/admin-head';
import { ArticlePickerModal } from '@/components/admin/article-picker-modal';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { ComposerHeader } from '@/components/admin/newsletter-editor/composer-header';
import { MobileSendBar } from '@/components/admin/newsletter-editor/mobile-send-bar';
import { NewsletterFields } from '@/components/admin/newsletter-editor/newsletter-fields';
import { RecipientsPanel } from '@/components/admin/newsletter-editor/recipients-panel';
import { SentNewsletter } from '@/components/admin/newsletter-editor/sent-newsletter';
import { NewsletterPreviewModal } from '@/components/admin/newsletter-preview-modal';
import { SubscriberPickerModal } from '@/components/admin/subscriber-picker-modal';
import type { NewsletterDraft } from '@/helpers/newsletter-editor';
import { frenchTypography } from '@/helpers/typography';
import { useNewsletterDuplicate } from '@/hooks/use-newsletter-duplicate';
import { useNewsletterEditorForm } from '@/hooks/use-newsletter-editor-form';
import { useNewsletterSendingPoll } from '@/hooks/use-newsletter-sending-poll';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AdminNewsletter } from '@/types/admin';

const text = adminLabels.newsletterEditor;

type NewsletterEditorProps = NewsletterDraft & {
    confirmedCount: number;
    /** The author's login email, plus the verified recovery email. */
    testEmails: string[];
    /** The sent email, for a newsletter that is no longer a draft. */
    emailHtml: string | null;
};

/**
 * The newsletter composer (ADM-SUB-20…26, ADM-SUB-29), or the read-only email of a newsletter already sent.
 * « Envoyer » asks for confirmation, then sends in the background (ADM-SUB-26, ADM-SUB-27).
 */
export default function NewsletterEditor(props: NewsletterEditorProps) {
    if (props.newsletter && props.newsletter.status !== 'draft') {
        return (
            <SentView
                newsletter={props.newsletter}
                emailHtml={props.emailHtml ?? ''}
            />
        );
    }

    return <Composer key={props.newsletter?.id ?? 'nouvelle'} {...props} />;
}

NewsletterEditor.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

function SentView({
    newsletter,
    emailHtml,
}: {
    newsletter: AdminNewsletter;
    emailHtml: string;
}) {
    const { duplicate } = useNewsletterDuplicate();

    useNewsletterSendingPoll(newsletter.status === 'sending');

    return (
        <SentNewsletter
            newsletter={newsletter}
            emailHtml={emailHtml}
            backUrl={index.url()}
            onDuplicate={() => duplicate(newsletter.id)}
        />
    );
}

function Composer({
    confirmedCount,
    testEmails,
    ...draft
}: NewsletterEditorProps) {
    const editor = useNewsletterEditorForm(draft, confirmedCount);

    return (
        <>
            <AdminHead title={editor.title} />

            <ComposerHeader editor={editor} backUrl={index.url()} />

            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    editor.save();
                }}
                className="laptop:grid-cols-[minmax(0,1fr)_20rem] laptop:gap-10 grid gap-5"
            >
                <NewsletterFields editor={editor} />
                <RecipientsPanel
                    editor={editor}
                    confirmedCount={confirmedCount}
                    testEmails={testEmails}
                />
            </form>

            <MobileSendBar
                recipientCount={editor.recipientCount}
                canSend={editor.canSend}
                onSend={editor.askSend}
            />

            <NewsletterPreviewModal preview={editor.preview} />
            <ArticlePickerModal picker={editor.articlePicker} />
            <SubscriberPickerModal picker={editor.subscriberPicker} />

            <ConfirmModal
                isOpen={editor.isLeaving}
                onClose={editor.cancelLeave}
                onConfirm={editor.confirmLeave}
                title={text.leaveTitle}
                description={text.leaveDescription}
                confirmLabel={text.leaveConfirm}
            />

            <ConfirmModal
                isOpen={editor.isConfirmingSend}
                onClose={editor.cancelSend}
                onConfirm={editor.sendToSubscribers}
                isConfirming={editor.isSending}
                title={text.sendTitle}
                description={frenchTypography(
                    text.sendDescription(
                        editor.data.subject.trim(),
                        editor.recipientCount,
                    ),
                )}
                confirmLabel={text.send}
                confirmVariant="primary"
            />
        </>
    );
}
