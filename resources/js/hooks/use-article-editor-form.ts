import { router, useForm } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import { clearArticleAutosave } from '@/helpers/article-autosave';
import type { EditorForm, SubmitIntent } from '@/helpers/article-editor';
import {
    autosavedFields,
    emptyFiles,
    fieldsOf,
    focusFirstError,
    isSlugCustom,
    keywordsFromInput,
    readingMinutes,
    slugFromTitle,
    wordCount,
} from '@/helpers/article-editor';
import { useArticleAutosave } from '@/hooks/use-article-autosave';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { adminLabels } from '@/lib/labels.admin.fr';
import { archive, store, update } from '@/routes/admin/articles';
import type {
    ArticleSuggestions,
    EditorArticle,
    WordImportResult,
} from '@/types/admin';

/**
 * State and actions of the article editor, without any markup: the form, the slug that follows the title,
 * the existing cover and audio, the autosave and the guard against leaving with unsaved changes.
 */
export function useArticleEditorForm(article: EditorArticle | null) {
    const serverFields = useMemo(() => fieldsOf(article), [article]);
    const form = useForm<EditorForm>({ ...serverFields, ...emptyFiles() });
    const { data, setData, isDirty } = form;
    const [existingCover, setExistingCover] = useState(
        article?.coverPhoto ?? null,
    );
    const [existingAudio, setExistingAudio] = useState(
        article?.audioUrl ?? null,
    );
    const [isSlugEdited, setIsSlugEdited] = useState(() =>
        isSlugCustom(article),
    );
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const isLeavingRef = useRef(false);

    const autosave = useArticleAutosave(
        article?.id ?? null,
        autosavedFields(data),
        isDirty,
        serverFields,
        article?.updatedAt ?? null,
    );

    const status = article?.status ?? 'DRAFT';
    const words = useMemo(
        () => wordCount(data.lead_paragraph, data.content),
        [data.lead_paragraph, data.content],
    );

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    function slugFor(title: string, currentSlug: string): string {
        return isSlugEdited ? currentSlug : slugFromTitle(title);
    }

    function changeTitle(title: string): void {
        setData((current) => ({
            ...current,
            title,
            slug: slugFor(title, current.slug),
        }));
    }

    function changeSlug(slug: string): void {
        setIsSlugEdited(true);
        setData('slug', slug);
    }

    function changeCover(file: File | null): void {
        if (!file) {
            setExistingCover(null);
        }

        setData((current) => ({
            ...current,
            cover: file,
            remove_cover: file === null && article?.coverPhoto != null,
        }));
    }

    function changeAudio(file: File | null): void {
        if (!file) {
            setExistingAudio(null);
        }

        setData((current) => ({
            ...current,
            audio: file,
            remove_audio: file === null && article?.audioUrl != null,
        }));
    }

    function changeCategories(categoryIds: number[], newNames: string[]): void {
        setData((current) => ({
            ...current,
            category_ids: categoryIds,
            new_categories: newNames,
        }));
    }

    function changeKeywords(value: string): void {
        setData('keywords', keywordsFromInput(value));
    }

    function applySeoSuggestions(suggestions: ArticleSuggestions): void {
        setData((current) => ({
            ...current,
            description: suggestions.description,
            keywords: suggestions.keywords,
        }));
    }

    function submit(intent: SubmitIntent): void {
        form.transform((current) => ({
            ...current,
            intent,
            ...(article ? { _method: 'put' } : {}),
        }));

        form.post(article ? update.url(article.id) : store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onError: focusFirstError,
            onSuccess: (page) => {
                clearArticleAutosave(article?.id ?? null);

                // Same article: start again from what the server stored (normalised keywords, final slug, cover).
                const saved = (page.props as { article?: EditorArticle | null })
                    .article;

                if (article && saved) {
                    const fields = { ...fieldsOf(saved), ...emptyFiles() };

                    form.setDefaults(fields);
                    form.setData(fields);
                    setExistingCover(saved.coverPhoto);
                    setExistingAudio(saved.audioUrl);
                }
            },
        });
    }

    function archiveArticle(): void {
        if (article) {
            router.patch(archive.url(article.id), {}, { preserveScroll: true });
        }
    }

    /**
     * Fill the form from a checked Word document (ADM-ART-41). Nothing is saved; the autosave keeps a copy.
     */
    function importDocument(fields: WordImportResult['fields']): void {
        setData((current) => ({
            ...current,
            title: fields.title,
            lead_paragraph: fields.lead_paragraph,
            content: fields.content,
            slug: slugFor(fields.title, current.slug),
        }));
        router.flash('success', adminLabels.wordImport.imported);
    }

    function restoreAutosave(): void {
        if (autosave.pending) {
            setData((current) => ({ ...current, ...autosave.pending!.fields }));
            setIsSlugEdited(true);
            autosave.dismissPending();
        }
    }

    function confirmLeave(): void {
        isLeavingRef.current = true;

        if (leavingUrl) {
            router.visit(leavingUrl);
        }
    }

    return {
        data,
        setData,
        errors: form.errors,
        processing: form.processing,
        uploadPercentage:
            form.processing && data.audio && form.progress
                ? (form.progress.percentage ?? 0)
                : null,
        status,
        isPublished: status === 'PUBLISHED',
        words,
        readingMinutes: readingMinutes(words),
        /** Something to lose if a Word document replaces the form. */
        hasContent: data.title.trim() !== '' || words > 0,
        existingCover,
        existingAudio,
        autosave,
        isLeaving: leavingUrl !== null,
        changeTitle,
        changeSlug,
        changeCover,
        changeAudio,
        changeCategories,
        changeKeywords,
        applySeoSuggestions,
        submit,
        archive: archiveArticle,
        importDocument,
        restoreAutosave,
        confirmLeave,
        cancelLeave: () => setLeavingUrl(null),
    };
}

export type ArticleEditorForm = ReturnType<typeof useArticleEditorForm>;
