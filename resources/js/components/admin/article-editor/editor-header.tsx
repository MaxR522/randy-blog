import { Link } from '@inertiajs/react';
import { ArrowLeft, Eye, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RowAction } from '@/helpers/row-actions-menu';
import { RowActionsMenu } from '@/components/admin/row-actions-menu/row-actions-menu';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/public/button';
import type { ArticleStatus } from '@/helpers/article';
import { statusVariants } from '@/helpers/article';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type EditorHeaderProps = {
    /** The articles list, where the back links lead. */
    backUrl: string;
    title: string;
    status: ArticleStatus;
    /** A saved article can be previewed; a new one can be filled from a Word document. */
    isSaved: boolean;
    isPublished: boolean;
    processing: boolean;
    onPreview: () => void;
    onWordImport: () => void;
    onArchive: () => void;
    /** Publish and save, shown from tablet up; the mobile bar holds them below. */
    actionButtons: ReactNode;
};

/**
 * Back link, page title with the article status, and the actions: buttons from tablet up, a menu on mobile.
 */
export function EditorHeader({
    backUrl,
    title,
    status,
    isSaved,
    isPublished,
    processing,
    onPreview,
    onWordImport,
    onArchive,
    actionButtons,
}: EditorHeaderProps) {
    const menuActions: RowAction[] = isSaved
        ? [
              { key: 'preview', label: text.preview, onSelect: onPreview },
              ...(isPublished
                  ? [
                        {
                            key: 'archive',
                            label: text.archive,
                            onSelect: onArchive,
                        },
                    ]
                  : []),
          ]
        : [
              {
                  key: 'word-import',
                  label: adminLabels.wordImport.open,
                  onSelect: onWordImport,
              },
          ];

    return (
        <>
            <Link
                href={backUrl}
                className="tablet:inline-flex text-body-small text-primary mb-3 hidden min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.articles.title}
            </Link>

            <div className="tablet:mb-2 tablet:gap-4 mb-1 flex items-center gap-1">
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
                    <StatusBadge variant={statusVariants[status]}>
                        {adminLabels.articles.status[status]}
                    </StatusBadge>
                </div>
                <div className="tablet:flex hidden flex-wrap items-center justify-end gap-3">
                    {isSaved ? (
                        <Button variant="ghost" onClick={onPreview}>
                            <Eye className="size-4" aria-hidden="true" />
                            {text.preview}
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={onWordImport}>
                            <Upload className="size-4" aria-hidden="true" />
                            {adminLabels.wordImport.open}
                        </Button>
                    )}
                    {isPublished && (
                        <Button
                            variant="secondary"
                            disabled={processing}
                            onClick={onArchive}
                        >
                            {text.archive}
                        </Button>
                    )}
                    {actionButtons}
                </div>
                <div className="tablet:hidden">
                    <RowActionsMenu
                        triggerLabel={text.moreActions}
                        menuLabel={text.actionsMenu}
                        title={title}
                        actions={menuActions}
                    />
                </div>
            </div>
        </>
    );
}
