import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { AccessibilityWarnings } from '@/components/admin/article-editor/accessibility-warnings';
import { AutosaveStatus } from '@/components/admin/article-editor/autosave-status';
import { ClassificationFields } from '@/components/admin/article-editor/classification-fields';
import { ContentFields } from '@/components/admin/article-editor/content-fields';
import { EditorActionButtons } from '@/components/admin/article-editor/editor-action-buttons';
import { EditorHeader } from '@/components/admin/article-editor/editor-header';
import { MobileActionBar } from '@/components/admin/article-editor/mobile-action-bar';
import { RestoreAutosaveBanner } from '@/components/admin/article-editor/restore-autosave-banner';
import { SeoFields } from '@/components/admin/article-editor/seo-fields';
import { ArticlePreviewPanel } from '@/components/admin/article-preview-panel';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { WordImportModal } from '@/components/admin/word-import/word-import-modal';
import { previewedArticleOf } from '@/helpers/article-editor';
import { useArticleEditorForm } from '@/hooks/use-article-editor-form';
import { useArticlePreview } from '@/hooks/use-article-preview';
import { useWordImport } from '@/hooks/use-word-import';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { index } from '@/routes/admin/articles';
import type {
    CategoryOption,
    EditorArticle,
    WordImportResult,
} from '@/types/admin';

const text = adminLabels.editor;

type ArticleEditorProps = {
    article: EditorArticle | null;
    categories: CategoryOption[];
};

/**
 * Article editor (ADM-ART-10…31): create at `/admin/articles/nouveau`, edit at `/admin/articles/{id}/modifier`.
 * Remounted when a new article gets its id, so the form starts again from the saved article.
 */
export default function ArticleEditor(props: ArticleEditorProps) {
    return <Editor key={props.article?.id ?? 'nouveau'} {...props} />;
}

ArticleEditor.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

function Editor({ article, categories }: ArticleEditorProps) {
    const editor = useArticleEditorForm(article);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isWordImportOpen, setIsWordImportOpen] = useState(false);
    const previewedArticle =
        article && isPreviewOpen ? previewedArticleOf(article) : null;
    const preview = useArticlePreview(previewedArticle);
    const wordImport = useWordImport();
    const accessibilityWarnings = usePage().flash.accessibilityWarnings ?? [];
    const { autosave, isPublished, processing } = editor;
    const title = article ? text.editTitle : text.createTitle;

    function openWordImport(): void {
        wordImport.reset();
        setIsWordImportOpen(true);
    }

    function closeWordImport(): void {
        wordImport.reset();
        setIsWordImportOpen(false);
    }

    function importDocument(fields: WordImportResult['fields']): void {
        editor.importDocument(fields);
        closeWordImport();
    }

    const actionButtons = (
        <EditorActionButtons
            isPublished={isPublished}
            processing={processing}
            onSubmit={editor.submit}
        />
    );

    return (
        <>
            <AdminHead title={title} />

            <EditorHeader
                backUrl={index.url()}
                title={title}
                status={editor.status}
                isSaved={article !== null}
                isPublished={isPublished}
                processing={processing}
                onPreview={() => setIsPreviewOpen(true)}
                onWordImport={openWordImport}
                onArchive={editor.archive}
                actionButtons={actionButtons}
            />

            <AutosaveStatus savedAt={autosave.savedAt} />

            <AccessibilityWarnings warnings={accessibilityWarnings} />

            {autosave.pending && autosave.pendingSavedAt && (
                <RestoreAutosaveBanner
                    savedAt={autosave.pendingSavedAt}
                    onDiscard={autosave.dismissPending}
                    onRestore={editor.restoreAutosave}
                />
            )}

            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    editor.submit('save');
                }}
                className="laptop:grid-cols-[minmax(0,1fr)_22rem] laptop:gap-10 grid gap-8"
            >
                <ContentFields
                    editor={editor}
                    audioDuration={article?.audioDuration ?? null}
                />

                <div className="flex min-w-0 flex-col gap-8">
                    <ClassificationFields
                        editor={editor}
                        categories={categories}
                    />
                    <SeoFields editor={editor} />
                </div>

                <div className="tablet:flex laptop:col-span-2 border-grey-light hidden justify-end gap-3 border-t pt-6">
                    {actionButtons}
                </div>
            </form>

            <MobileActionBar isSingle={isPublished}>
                {actionButtons}
            </MobileActionBar>

            {/* The saved article, as in the list; publishing or archiving there reloads the status shown here. */}
            <ArticlePreviewPanel
                article={previewedArticle}
                onClose={() => setIsPreviewOpen(false)}
                editUrl={null}
                isChangingStatus={preview.isChangingStatus}
                onChangeStatus={preview.changeStatus}
                frameVersion={preview.frameVersion}
                isFrameLoaded={preview.isFrameLoaded}
                onFrameLoad={preview.markFrameLoaded}
            />

            {!article && (
                <WordImportModal
                    isOpen={isWordImportOpen}
                    onClose={closeWordImport}
                    wordImport={wordImport}
                    hasContent={editor.hasContent}
                    onImport={importDocument}
                />
            )}

            <ConfirmModal
                isOpen={editor.isLeaving}
                onClose={editor.cancelLeave}
                onConfirm={editor.confirmLeave}
                title={text.leaveTitle}
                description={text.leaveDescription}
                confirmLabel={text.leaveConfirm}
            />
        </>
    );
}
