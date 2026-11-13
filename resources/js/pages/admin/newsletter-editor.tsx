import { Link, router, useForm, usePoll } from '@inertiajs/react';
import { ArrowLeft, Eye, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor as TinyMCEInstance } from 'tinymce';
import {
    duplicate,
    index,
    store,
    test,
    update,
} from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { AdminHead } from '@/components/admin/admin-head';
import type { PickedArticle } from '@/components/admin/article-picker-modal';
import { ArticlePickerModal } from '@/components/admin/article-picker-modal';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { NewsletterPreviewModal } from '@/components/admin/newsletter-preview-modal';
import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import type { RowAction } from '@/components/admin/row-actions-menu';
import { RowActionsMenu } from '@/components/admin/row-actions-menu';
import type { PickedSubscriber } from '@/components/admin/subscriber-picker-modal';
import { SubscriberPickerModal } from '@/components/admin/subscriber-picker-modal';
import { FieldError, TextField } from '@/components/admin/text-field';
import type { ToolbarButton } from '@/components/admin/tinymce-editor';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { send, sendDraft } from '@/routes/admin/newsletters';
import { adminLabels } from '@/lib/labels.admin.fr';
import { frenchTypography } from '@/lib/typography';
import { useUnsavedChangesGuard } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import type { AdminNewsletter } from '@/types/admin';

const text = adminLabels.newsletterEditor;

const MAX_LENGTH = 150;

type NewsletterEditorProps = {
    newsletter: AdminNewsletter | null;
    content: string | null;
    selectedSubscribers: PickedSubscriber[];
    confirmedCount: number;
    /** The author's login email, plus the verified recovery email. */
    testEmails: string[];
    /** The article of the publish toast's shortcut (ADM-SUB-30), inserted as a card in a new newsletter. */
    initialArticle: PickedArticle | null;
    /** The sent email, for a newsletter that is no longer a draft. */
    emailHtml: string | null;
};

type NewsletterForm = {
    subject: string;
    preheader: string;
    content: string;
    audience: 'all' | 'selection';
    subscription_ids: number[];
};

/**
 * The newsletter composer (ADM-SUB-20…26, ADM-SUB-29), or the read-only email of a newsletter already sent.
 * « Envoyer » asks for confirmation, then sends in the background (ADM-SUB-26, ADM-SUB-27).
 */
export default function NewsletterEditor(props: NewsletterEditorProps) {
    if (props.newsletter && props.newsletter.status !== 'draft') {
        return (
            <SentNewsletter
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

function articleCardHtml(article: PickedArticle): string {
    const card = document.createElement('div');
    card.setAttribute('data-article-card', String(article.id));

    if (article.thumbnail) {
        const image = document.createElement('img');
        image.src = article.thumbnail;
        image.alt = '';
        card.append(image);
    }

    for (const [line, isBold] of [
        [article.title, true],
        [article.chapo, false],
        ['Lire l’article', false],
    ] as const) {
        const paragraph = document.createElement('p');

        if (isBold) {
            const strong = document.createElement('strong');
            strong.textContent = line;
            paragraph.append(strong);
        } else {
            paragraph.textContent = line;
        }

        card.append(paragraph);
    }

    return card.outerHTML + '<p></p>';
}

function Composer({
    newsletter,
    content,
    selectedSubscribers,
    confirmedCount,
    testEmails,
    initialArticle,
}: NewsletterEditorProps) {
    const form = useForm<NewsletterForm>({
        subject: newsletter?.subject ?? initialArticle?.title ?? '',
        preheader: newsletter?.preheader ?? '',
        content:
            content ?? (initialArticle ? articleCardHtml(initialArticle) : ''),
        audience: newsletter?.audience ?? 'all',
        subscription_ids: selectedSubscribers.map(({ id }) => id),
    });
    const { data, setData, errors, processing, isDirty } = form;
    const [selection, setSelection] = useState(selectedSubscribers);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);
    const [isSubscriberPickerOpen, setIsSubscriberPickerOpen] = useState(false);
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isConfirmingSend, setIsConfirmingSend] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isLeavingRef = useRef(false);
    const editorRef = useRef<TinyMCEInstance | null>(null);

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    const title = newsletter ? text.editTitle : text.createTitle;
    const recipientCount =
        data.audience === 'all' ? confirmedCount : selection.length;
    const selectionError = Object.entries(errors).find(([key]) =>
        key.startsWith('subscription_ids'),
    )?.[1];

    const toolbarButtons: ToolbarButton[] = [
        {
            name: 'insertarticle',
            text: adminLabels.richText.insertArticle,
            icon: 'plus',
            onAction: (editor) => {
                editorRef.current = editor;
                setIsArticlePickerOpen(true);
            },
        },
    ];

    const insertArticle = useCallback((article: PickedArticle) => {
        setIsArticlePickerOpen(false);
        const editor = editorRef.current;

        if (editor) {
            editor.focus();
            editor.insertContent(articleCardHtml(article));
        }
    }, []);

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

    function chooseSubscribers(picked: PickedSubscriber[]): void {
        setIsSubscriberPickerOpen(false);
        setSelection(picked);
        setData(
            'subscription_ids',
            picked.map(({ id }) => id),
        );
    }

    const menuActions: RowAction[] = [
        { key: 'test', label: text.sendTest, onSelect: sendTest },
        { key: 'save', label: text.saveDraft, onSelect: save },
    ];

    const sendButton = (
        <Button
            disabled={
                processing || data.subject.trim() === '' || recipientCount === 0
            }
            onClick={() => setIsConfirmingSend(true)}
            className="w-full"
        >
            <Send aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
            {text.send}
        </Button>
    );

    return (
        <>
            <AdminHead title={title} />

            <Link
                href={index.url()}
                className="tablet:inline-flex text-body-small text-primary mb-3 hidden min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.subscriptions.title}
            </Link>

            <div className="tablet:mb-8 tablet:gap-4 mb-1 flex items-center gap-1">
                <Link
                    href={index.url()}
                    aria-label={text.back}
                    className="tablet:hidden -ml-3 inline-flex size-11 flex-none items-center justify-center rounded-md"
                >
                    <ArrowLeft className="size-5.5" aria-hidden="true" />
                </Link>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <h1 className="tablet:text-h2 truncate text-[1.0625rem] font-semibold">
                        {title}
                    </h1>
                    <span className="tablet:inline-flex hidden">
                        <NewsletterStatusBadge status="draft" />
                    </span>
                </div>
                <div className="tablet:flex hidden flex-wrap items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsPreviewOpen(true)}
                    >
                        <Eye className="size-4" aria-hidden="true" />
                        {text.preview}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={processing}
                        isLoading={isTesting}
                        onClick={sendTest}
                    >
                        {text.sendTest}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={processing}
                        isLoading={processing && !isTesting}
                        onClick={save}
                    >
                        {text.saveDraft}
                    </Button>
                    <span className="w-auto">{sendButton}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    aria-label={text.preview}
                    className="tablet:hidden flex size-11 flex-none items-center justify-center rounded-md"
                >
                    <Eye
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.75}
                    />
                </button>
                <div className="tablet:hidden">
                    <RowActionsMenu
                        triggerLabel={text.moreActions}
                        menuLabel={text.actionsMenu}
                        title={title}
                        actions={menuActions}
                    />
                </div>
            </div>

            <div className="tablet:hidden mb-5 flex items-center gap-2">
                <NewsletterStatusBadge status="draft" />
                <span className="text-caption text-grey-dark">
                    {text.mobileMenuHint}
                </span>
            </div>

            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    save();
                }}
                className="laptop:grid-cols-[minmax(0,1fr)_20rem] laptop:gap-10 grid gap-5"
            >
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
                        maxLength={MAX_LENGTH}
                        error={errors.subject}
                        help={text.count(data.subject.length)}
                        onChange={(event) =>
                            setData('subject', event.target.value)
                        }
                    />
                    <TextField
                        label={`${text.preheader} ${text.optional}`}
                        name="preheader"
                        value={data.preheader}
                        maxLength={MAX_LENGTH}
                        error={errors.preheader}
                        help={text.preheaderHelp(data.preheader.length)}
                        onChange={(event) =>
                            setData('preheader', event.target.value)
                        }
                    />
                    <RichTextEditor
                        label={text.content}
                        config="newsletter"
                        value={data.content}
                        onChange={(html) => setData('content', html)}
                        onNormalize={(html) => {
                            form.setDefaults('content', html);
                            setData('content', html);
                        }}
                        error={errors.content}
                        help={text.contentHelp}
                        toolbarButtons={toolbarButtons}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <fieldset className="border-grey-light flex flex-col gap-3 rounded-md border p-4">
                        <legend className="text-overline text-grey-dark px-1.5 font-semibold uppercase">
                            {text.recipients}
                        </legend>
                        <AudienceOption
                            checked={data.audience === 'all'}
                            onChange={() => setData('audience', 'all')}
                            label={text.allSubscribers}
                            help={text.subscriberCount(confirmedCount)}
                        />
                        <AudienceOption
                            checked={data.audience === 'selection'}
                            onChange={() => setData('audience', 'selection')}
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
                                onClick={() => setIsSubscriberPickerOpen(true)}
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
            </form>

            <div className="tablet:hidden -mx-gutter border-grey-light px-gutter sticky bottom-0 z-10 mt-6 flex flex-col gap-2 border-t bg-white py-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.15)]">
                <p className="text-caption text-grey-dark text-center">
                    {text.recipientTotal(recipientCount)}
                </p>
                {sendButton}
            </div>

            <NewsletterPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                fields={{
                    subject: data.subject,
                    preheader: data.preheader,
                    content: data.content,
                }}
            />

            <ArticlePickerModal
                isOpen={isArticlePickerOpen}
                onClose={() => setIsArticlePickerOpen(false)}
                onInsert={insertArticle}
            />

            <SubscriberPickerModal
                isOpen={isSubscriberPickerOpen}
                onClose={() => setIsSubscriberPickerOpen(false)}
                selection={selection}
                onConfirm={chooseSubscribers}
            />

            <ConfirmModal
                isOpen={leavingUrl !== null}
                onClose={() => setLeavingUrl(null)}
                onConfirm={() => {
                    isLeavingRef.current = true;

                    if (leavingUrl) {
                        router.visit(leavingUrl);
                    }
                }}
                title={text.leaveTitle}
                description={text.leaveDescription}
                confirmLabel={text.leaveConfirm}
            />

            <ConfirmModal
                isOpen={isConfirmingSend}
                onClose={() => setIsConfirmingSend(false)}
                onConfirm={sendToSubscribers}
                isConfirming={isSending}
                title={text.sendTitle}
                description={frenchTypography(
                    text.sendDescription(data.subject.trim(), recipientCount),
                )}
                confirmLabel={text.send}
                confirmVariant="primary"
            />
        </>
    );
}

function AudienceOption({
    checked,
    onChange,
    label,
    help,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
    help: string;
}) {
    return (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
            <input
                type="radio"
                name="audience"
                checked={checked}
                onChange={onChange}
                className="accent-primary mt-0.5 size-5 flex-none"
            />
            <span>
                <span className="block font-semibold">{label}</span>
                <span className="text-caption text-grey-dark">{help}</span>
            </span>
        </label>
    );
}

/**
 * A newsletter no longer a draft: its email as sent, its delivery counts and « Dupliquer » (ADM-SUB-10).
 */
function SentNewsletter({
    newsletter,
    emailHtml,
}: {
    newsletter: AdminNewsletter;
    emailHtml: string;
}) {
    const deliveryText = adminLabels.newsletters;

    // The delivery counts move while the jobs run (ADM-SUB-27).
    const isSending = newsletter.status === 'sending';
    const { start, stop } = usePoll(
        5000,
        { only: ['newsletter'] },
        { autoStart: false },
    );

    useEffect(() => {
        if (isSending) {
            start();
        } else {
            stop();
        }

        return stop;
    }, [isSending, start, stop]);

    return (
        <>
            <AdminHead title={newsletter.subject} />

            <Link
                href={index.url()}
                className="text-body-small text-primary mb-3 inline-flex min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.subscriptions.title}
            </Link>

            <div className="tablet:flex-row tablet:items-center mb-6 flex flex-col gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h1 className="tablet:text-h2 text-[1.375rem] leading-tight font-semibold">
                        {frenchTypography(newsletter.subject)}
                    </h1>
                    <p className="text-body-small text-grey-dark flex flex-wrap items-center gap-2">
                        <NewsletterStatusBadge status={newsletter.status} />
                        {newsletter.sentAtLabel &&
                            text.sentOn(newsletter.sentAtLabel)}
                        <span>
                            ·{' '}
                            {deliveryText.delivery(
                                newsletter.sentCount,
                                newsletter.recipientsCount,
                                newsletter.failedCount,
                            )}
                        </span>
                    </p>
                </div>
                {!isSending && (
                    <Button
                        variant="secondary"
                        onClick={() =>
                            router.post(duplicate.url(newsletter.id))
                        }
                        className={cn('tablet:w-auto w-full')}
                    >
                        {text.duplicate}
                    </Button>
                )}
            </div>

            <iframe
                title={adminLabels.newsletterPreview.frameTitle}
                sandbox=""
                srcDoc={emailHtml}
                className="border-grey-light h-[75dvh] w-full rounded-md border"
            />
        </>
    );
}
