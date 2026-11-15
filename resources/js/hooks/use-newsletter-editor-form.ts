import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { Editor as TinyMCEInstance } from 'tinymce';
import {
    store,
    test,
    update,
} from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import type { PickedArticle } from '@/helpers/article-picker';
import type {
    NewsletterDraft,
    NewsletterForm,
} from '@/helpers/newsletter-editor';
import {
    articleCardHtml,
    newsletterFieldsOf,
    selectionErrorOf,
} from '@/helpers/newsletter-editor';
import type { PickedSubscriber } from '@/helpers/subscriber-picker';
import type { ToolbarButton } from '@/helpers/tinymce-editor';
import { useArticlePicker } from '@/hooks/use-article-picker';
import { useNewsletterPreview } from '@/hooks/use-newsletter-preview';
import { useSubscriberPicker } from '@/hooks/use-subscriber-picker';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { adminLabels } from '@/lib/labels.admin.fr';
import { send, sendDraft } from '@/routes/admin/newsletters';

const text = adminLabels.newsletterEditor;

/**
 * State and actions of the newsletter composer (ADM-SUB-20…26, ADM-SUB-29): the fields, the recipients, « Envoyer un
 * test », « Enregistrer le brouillon », « Envoyer » after confirmation, the article and subscriber pickers, the
 * preview and the guard against leaving with unsaved changes.
 */
export function useNewsletterEditorForm(
    draft: NewsletterDraft,
    confirmedCount: number,
) {
    const { newsletter, selectedSubscribers } = draft;
    const form = useForm<NewsletterForm>(newsletterFieldsOf(draft));
    const { data, setData, errors, processing, isDirty } = form;
    const [selection, setSelection] = useState(selectedSubscribers);
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isConfirmingSend, setIsConfirmingSend] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isLeavingRef = useRef(false);
    const editorRef = useRef<TinyMCEInstance | null>(null);

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    const articlePicker = useArticlePicker(insertArticle);
    const subscriberPicker = useSubscriberPicker(chooseSubscribers);
    const preview = useNewsletterPreview();

    const recipientCount =
        data.audience === 'all' ? confirmedCount : selection.length;

    const toolbarButtons: ToolbarButton[] = [
        {
            name: 'insertarticle',
            text: adminLabels.richText.insertArticle,
            icon: 'plus',
            onAction: (editor) => {
                editorRef.current = editor;
                articlePicker.open();
            },
        },
    ];

    function insertArticle(article: PickedArticle): void {
        const editor = editorRef.current;

        if (editor) {
            editor.focus();
            editor.insertContent(articleCardHtml(article));
        }
    }

    function chooseSubscribers(picked: PickedSubscriber[]): void {
        setSelection(picked);
        setData(
            'subscription_ids',
            picked.map(({ id }) => id),
        );
    }

    function save(): void {
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
            },
        };

        if (newsletter) {
            form.put(update.url(newsletter.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    function sendTest(): void {
        form.post(test.url(), {
            preserveScroll: true,
            onStart: () => setIsTesting(true),
            onFinish: () => setIsTesting(false),
        });
    }

    function sendToSubscribers(): void {
        form.post(newsletter ? sendDraft.url(newsletter.id) : send.url(), {
            preserveScroll: true,
            onStart: () => setIsSending(true),
            onSuccess: () => {
                isLeavingRef.current = true;
            },
            onFinish: () => {
                setIsSending(false);
                setIsConfirmingSend(false);
            },
        });
    }

    function confirmLeave(): void {
        isLeavingRef.current = true;

        if (leavingUrl) {
            router.visit(leavingUrl);
        }
    }

    return {
        data,
        errors,
        processing,
        title: newsletter ? text.editTitle : text.createTitle,
        selection,
        recipientCount,
        selectionError: selectionErrorOf(errors),
        canSend:
            !processing && data.subject.trim() !== '' && recipientCount > 0,
        isTesting,
        isSending,
        isConfirmingSend,
        isLeaving: leavingUrl !== null,
        toolbarButtons,
        articlePicker,
        subscriberPicker,
        preview,
        changeSubject: (subject: string): void => setData('subject', subject),
        changePreheader: (preheader: string): void =>
            setData('preheader', preheader),
        changeContent: (html: string): void => setData('content', html),
        normalizeContent: (html: string): void => {
            form.setDefaults('content', html);
            setData('content', html);
        },
        changeAudience: (audience: NewsletterForm['audience']): void =>
            setData('audience', audience),
        openSubscriberPicker: (): void => subscriberPicker.open(selection),
        openPreview: (): void =>
            preview.open({
                subject: data.subject,
                preheader: data.preheader,
                content: data.content,
            }),
        save,
        sendTest,
        askSend: (): void => setIsConfirmingSend(true),
        cancelSend: (): void => setIsConfirmingSend(false),
        sendToSubscribers,
        confirmLeave,
        cancelLeave: (): void => setLeavingUrl(null),
    };
}

export type NewsletterEditorForm = ReturnType<typeof useNewsletterEditorForm>;
