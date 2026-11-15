import { Link } from '@inertiajs/react';
import { ExternalLink, X } from 'lucide-react';
import { useModalDialog } from '@/components/admin/modal';
import { Button, buttonClasses } from '@/components/public/button';
import type { PreviewedArticle } from '@/helpers/article';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.articles;

type PanelContentProps = {
    article: PreviewedArticle;
    onClose: () => void;
    /** « Modifier », or `null` from the editor of this article, where it would lead back to the same page. */
    editUrl: string | null;
    isChangingStatus: boolean;
    onChangeStatus: () => void;
    /** Changes after a status change, so the frame reloads. */
    frameVersion: number;
    isFrameLoaded: boolean;
    onFrameLoad: () => void;
};

type ArticlePreviewPanelProps = Omit<PanelContentProps, 'article'> & {
    /** `null` when closed. */
    article: PreviewedArticle | null;
};

const iconButtonClasses =
    'text-primary flex size-11 flex-none cursor-pointer items-center justify-center rounded-md';

/**
 * The article as visitors will see it, in a frame: a drawer on the right from 768 px, a bottom sheet below.
 * The frame loads the preview route with `?integre=1`, so the public page renders without its navbar and footer.
 */
export function ArticlePreviewPanel({
    article,
    ...props
}: ArticlePreviewPanelProps) {
    const { onClose } = props;
    const { dialogRef, closeOnVeilClick } = useModalDialog(
        article !== null,
        onClose,
    );

    return (
        <dialog
            ref={dialogRef}
            aria-label={article ? text.previewFrame(article.title) : undefined}
            onClose={onClose}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary tablet:mt-0 tablet:mr-0 tablet:ml-auto tablet:h-dvh tablet:max-h-none tablet:max-w-180 tablet:rounded-none tablet:border-l tablet:border-grey-light m-0 mt-auto h-[92dvh] max-h-none w-full max-w-none rounded-t-lg bg-white p-0"
        >
            {article && (
                <PanelContent key={article.id} article={article} {...props} />
            )}
        </dialog>
    );
}

function PanelContent({
    article,
    onClose,
    editUrl,
    isChangingStatus,
    onChangeStatus,
    frameVersion,
    isFrameLoaded,
    onFrameLoad,
}: PanelContentProps) {
    const isPublished = article.status === 'PUBLISHED';

    return (
        <div className="flex h-full flex-col">
            <div
                aria-hidden="true"
                className="bg-grey-light tablet:hidden mx-auto mt-2 h-1 w-10 flex-none rounded-xs"
            />
            <div className="border-grey-light tablet:py-3 tablet:pr-3 tablet:pl-6 flex flex-none items-center gap-2 border-b py-2 pr-1 pl-4">
                {editUrl !== null && (
                    <Link
                        href={editUrl}
                        className={buttonClasses(
                            'secondary',
                            'tablet:flex-none flex-1',
                        )}
                    >
                        {text.edit}
                    </Link>
                )}
                <Button
                    variant={isPublished ? 'secondary' : 'primary'}
                    onClick={onChangeStatus}
                    isLoading={isChangingStatus}
                    disabled={isChangingStatus}
                    className="tablet:flex-none flex-1"
                >
                    {isPublished ? text.archive : text.publish}
                </Button>
                <a
                    href={article.previewUrl}
                    target="_blank"
                    rel="noopener"
                    aria-label={text.openPreviewInNewTab}
                    className={cn(iconButtonClasses, 'tablet:ml-auto')}
                >
                    <ExternalLink
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.75}
                    />
                </a>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={adminLabels.modal.close}
                    className={iconButtonClasses}
                >
                    <X
                        aria-hidden="true"
                        className="size-5.5"
                        strokeWidth={1.75}
                    />
                </button>
            </div>
            <div className="relative min-h-0 flex-1">
                {!isFrameLoaded && (
                    <div
                        aria-hidden="true"
                        className="bg-grey-subtle absolute inset-0 motion-safe:animate-pulse"
                    />
                )}
                <iframe
                    key={frameVersion}
                    title={text.previewFrame(article.title)}
                    src={`${article.previewUrl}?integre=1`}
                    onLoad={onFrameLoad}
                    className="relative block size-full border-0"
                />
            </div>
        </div>
    );
}
