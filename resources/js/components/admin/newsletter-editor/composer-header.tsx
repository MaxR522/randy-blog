import { Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { SendButton } from '@/components/admin/newsletter-editor/send-button';
import { RowActionsMenu } from '@/components/admin/row-actions-menu/row-actions-menu';
import { Button } from '@/components/public/button';
import type { RowAction } from '@/helpers/row-actions-menu';
import type { NewsletterEditorForm } from '@/hooks/use-newsletter-editor-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletterEditor;

type ComposerHeaderProps = {
    editor: NewsletterEditorForm;
    backUrl: string;
};

/**
 * The composer's header: back links, title and draft badge, the actions on wider screens, and on phones the preview
 * icon and the « Plus d’actions » menu.
 */
export function ComposerHeader({ editor, backUrl }: ComposerHeaderProps) {
    const { title, processing, isTesting } = editor;
    const menuActions: RowAction[] = [
        { key: 'test', label: text.sendTest, onSelect: editor.sendTest },
        { key: 'save', label: text.saveDraft, onSelect: editor.save },
    ];

    return (
        <>
            <Link
                href={backUrl}
                className="tablet:inline-flex text-body-small text-primary mb-3 hidden min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.subscriptions.title}
            </Link>

            <div className="tablet:mb-8 tablet:gap-4 mb-1 flex items-center gap-1">
                <Link
                    href={backUrl}
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
                    <Button variant="ghost" onClick={editor.openPreview}>
                        <Eye className="size-4" aria-hidden="true" />
                        {text.preview}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={processing}
                        isLoading={isTesting}
                        onClick={editor.sendTest}
                    >
                        {text.sendTest}
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={processing}
                        isLoading={processing && !isTesting}
                        onClick={editor.save}
                    >
                        {text.saveDraft}
                    </Button>
                    <span className="w-auto">
                        <SendButton
                            isDisabled={!editor.canSend}
                            onClick={editor.askSend}
                        />
                    </span>
                </div>
                <button
                    type="button"
                    onClick={editor.openPreview}
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
        </>
    );
}
