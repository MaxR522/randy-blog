import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import {
    ArticlePreviewPanel,
    statusVariants,
} from '@/components/admin/article-preview-panel';
import { CategoryPicker } from '@/components/admin/category-picker';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { FieldError } from '@/components/admin/text-field';
import { ImageUploader } from '@/components/admin/image-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import type { RowAction } from '@/components/admin/row-actions-menu';
import { RowActionsMenu } from '@/components/admin/row-actions-menu';
import { StatusBadge } from '@/components/admin/status-badge';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import type { AutosavedFields } from '@/lib/article-autosave';
import {
    clearArticleAutosave,
    frenchTime,
    useArticleAutosave,
} from '@/lib/article-autosave';
import { adminLabels } from '@/lib/labels.admin.fr';
import { useUnsavedChangesGuard } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import { archive, index, store, update } from '@/routes/admin/articles';
import type { CategoryOption, EditorArticle } from '@/types/admin';

const text = adminLabels.editor;

const WORDS_PER_MINUTE = 200;

/**
 * Fields in page order: the first one with an error gets the focus (A11Y-FORM-2).
 */
const FIELD_ORDER = [
    'title',
    'lead_paragraph',
    'cover',
    'cover_photo_credit',
    'content',
    'category_ids',
    'description',
    'keywords',
    'slug',
] as const;

type ArticleEditorProps = {
    article: EditorArticle | null;
    categories: CategoryOption[];
};

type EditorForm = AutosavedFields & {
    cover: File | null;
    remove_cover: boolean;
};

/**
 * Same rule as `ArticleSlug::fromTitle`: lowercase ASCII words joined by hyphens, apostrophes splitting words.
 */
function slugFromTitle(title: string): string {
    return title
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/œ/gi, 'oe')
        .replace(/æ/gi, 'ae')
        .toLowerCase()
        .replace(/['’]/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function fieldsOf(article: EditorArticle | null): AutosavedFields {
    return {
        title: article?.title ?? '',
        lead_paragraph: article?.leadParagraph ?? '',
        content: article?.content ?? '',
        cover_photo_credit: article?.coverPhotoCredit ?? '',
        category_ids: article?.categoryIds ?? [],
        new_categories: [],
        description: article?.description ?? '',
        keywords: article?.keywords ?? '',
        slug: article?.slug ?? '',
    };
}

function autosavedFields(data: EditorForm): AutosavedFields {
    return {
        title: data.title,
        lead_paragraph: data.lead_paragraph,
        content: data.content,
        cover_photo_credit: data.cover_photo_credit,
        category_ids: data.category_ids,
        new_categories: data.new_categories,
        description: data.description,
        keywords: data.keywords,
        slug: data.slug,
    };
}

/**
 * Words of the chapô and the text, counted like `Article::wordCount` on the server.
 */
function wordCount(...htmlParts: string[]): number {
    const parser = new DOMParser();
    const plain = htmlParts
        .map(
            (html) =>
                parser.parseFromString(html, 'text/html').body.textContent ??
                '',
        )
        .join(' ');

    return plain.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

/**
 * Article editor (ADM-ART-10…31): create at `/admin/articles/nouveau`, edit at `/admin/articles/{id}/modifier`.
 * Remounted when a new article gets its id, so the form starts again from the saved article.
 */
export default function ArticleEditor(props: ArticleEditorProps) {
    return <Editor key={props.article?.id ?? 'nouveau'} {...props} />;
}

ArticleEditor.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

function Editor({ article, categories }: ArticleEditorProps) {
    const serverFields = useMemo(() => fieldsOf(article), [article]);
    const form = useForm<EditorForm>({
        ...serverFields,
        cover: null,
        remove_cover: false,
    });
    const { data, setData, errors, processing, isDirty } = form;
    const [existingCover, setExistingCover] = useState(
        article?.coverPhoto ?? null,
    );
    const [isSlugEdited, setIsSlugEdited] = useState(
        () =>
            article !== null &&
            (article.isSlugFrozen ||
                article.slug !== slugFromTitle(article.title)),
    );
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const isLeavingRef = useRef(false);

    const autosave = useArticleAutosave(
        article?.id ?? null,
        autosavedFields(data),
        isDirty,
        serverFields,
        article?.updatedAt ?? null,
    );

    const status = article?.status ?? 'DRAFT';
    const isPublished = status === 'PUBLISHED';
    const words = useMemo(
        () => wordCount(data.lead_paragraph, data.content),
        [data.lead_paragraph, data.content],
    );

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    function changeTitle(title: string): void {
        setData((current) => ({
            ...current,
            title,
            slug: isSlugEdited ? current.slug : slugFromTitle(title),
        }));
    }

    function focusFirstError(fieldErrors: Partial<Record<string, string>>) {
        const field = FIELD_ORDER.find((name) => fieldErrors[name]);
        const container = field
            ? document.querySelector<HTMLElement>(`[data-field="${field}"]`)
            : null;

        if (!container) {
            return;
        }

        container.scrollIntoView({ block: 'center' });

        // TinyMCE hides the textarea and edits inside an iframe: focus its body instead.
        const editorBody =
            container.querySelector('iframe')?.contentDocument?.body;

        if (editorBody) {
            editorBody.focus();

            return;
        }

        container
            .querySelector<HTMLElement>(
                'input:not([type="file"]), textarea, button',
            )
            ?.focus({ preventScroll: true });
    }

    function submit(intent: 'save' | 'publish'): void {
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
                const saved = (page.props as Partial<ArticleEditorProps>)
                    .article;

                if (article && saved) {
                    const fields = {
                        ...fieldsOf(saved),
                        cover: null,
                        remove_cover: false,
                    };

                    form.setDefaults(fields);
                    form.setData(fields);
                    setExistingCover(saved.coverPhoto);
                }
            },
        });
    }

    function archiveArticle(): void {
        if (article) {
            router.patch(archive.url(article.id), {}, { preserveScroll: true });
        }
    }

    function restoreAutosave(): void {
        if (autosave.pending) {
            setData((current) => ({ ...current, ...autosave.pending!.fields }));
            setIsSlugEdited(true);
            autosave.dismissPending();
        }
    }

    const menuActions: RowAction[] = article
        ? [
              {
                  key: 'preview',
                  label: text.preview,
                  onSelect: () => setIsPreviewOpen(true),
              },
              ...(isPublished
                  ? [
                        {
                            key: 'archive',
                            label: text.archive,
                            onSelect: archiveArticle,
                        },
                    ]
                  : []),
          ]
        : [];

    const title = article ? text.editTitle : text.createTitle;

    const actionButtons = (
        <>
            {!isPublished && (
                <Button
                    variant="secondary"
                    disabled={processing}
                    onClick={() => submit('publish')}
                >
                    {text.publish}
                </Button>
            )}
            <Button
                isLoading={processing}
                disabled={processing}
                onClick={() => submit('save')}
            >
                {text.save}
            </Button>
        </>
    );

    return (
        <>
            <AdminHead title={title} />

            <Link
                href={index.url()}
                className="tablet:inline-flex text-body-small text-primary mb-3 hidden min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.articles.title}
            </Link>

            <div className="tablet:mb-2 tablet:gap-4 mb-1 flex items-center gap-1">
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
                    <StatusBadge variant={statusVariants[status]}>
                        {adminLabels.articles.status[status]}
                    </StatusBadge>
                </div>
                <div className="tablet:flex hidden flex-wrap items-center justify-end gap-3">
                    {article && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            <Eye className="size-4" aria-hidden="true" />
                            {text.preview}
                        </Button>
                    )}
                    {isPublished && (
                        <Button
                            variant="secondary"
                            disabled={processing}
                            onClick={archiveArticle}
                        >
                            {text.archive}
                        </Button>
                    )}
                    {actionButtons}
                </div>
                {menuActions.length > 0 && (
                    <div className="tablet:hidden">
                        <RowActionsMenu
                            triggerLabel={text.moreActions}
                            menuLabel={text.actionsMenu}
                            title={title}
                            actions={menuActions}
                        />
                    </div>
                )}
            </div>

            <p
                className="text-caption text-grey-dark mb-6 min-h-4.5"
                aria-live="polite"
            >
                {autosave.savedAt &&
                    text.autosavedAt(frenchTime(autosave.savedAt))}
            </p>

            {autosave.pending && autosave.pendingSavedAt && (
                <div
                    role="status"
                    className="border-accent-200 bg-accent-50 text-body-small tablet:flex-row tablet:items-center tablet:justify-between mb-6 flex flex-col gap-3 rounded-md border px-4 py-3"
                >
                    <p>
                        {text.restoreTitle(frenchTime(autosave.pendingSavedAt))}{' '}
                        {text.restoreCoverNote}
                    </p>
                    <div className="flex flex-none gap-2">
                        <Button
                            variant="secondary"
                            onClick={autosave.dismissPending}
                        >
                            {text.discard}
                        </Button>
                        <Button onClick={restoreAutosave}>
                            {text.restore}
                        </Button>
                    </div>
                </div>
            )}

            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    submit('save');
                }}
                className="laptop:grid-cols-[minmax(0,1fr)_22rem] laptop:gap-10 grid gap-8"
            >
                <div className="flex min-w-0 flex-col gap-7">
                    <div data-field="title">
                        <TextField
                            label={text.title}
                            name="title"
                            value={data.title}
                            maxLength={255}
                            error={errors.title}
                            onChange={(event) =>
                                changeTitle(event.target.value)
                            }
                            className="tablet:text-[1.375rem] h-14 text-xl font-semibold"
                        />
                    </div>
                    <div data-field="lead_paragraph">
                        <RichTextEditor
                            label={text.chapo}
                            config="minimal"
                            value={data.lead_paragraph}
                            error={errors.lead_paragraph}
                            onChange={(html) => setData('lead_paragraph', html)}
                        />
                    </div>
                    <div data-field="cover">
                        <ImageUploader
                            label={text.cover}
                            value={data.cover}
                            existingUrl={existingCover}
                            error={errors.cover}
                            onChange={(file) => {
                                if (!file) {
                                    setExistingCover(null);
                                }

                                setData((current) => ({
                                    ...current,
                                    cover: file,
                                    remove_cover:
                                        file === null &&
                                        article?.coverPhoto != null,
                                }));
                            }}
                        />
                    </div>
                    <div data-field="cover_photo_credit">
                        <TextField
                            label={text.coverCredit}
                            name="cover_photo_credit"
                            value={data.cover_photo_credit}
                            maxLength={255}
                            error={errors.cover_photo_credit}
                            onChange={(event) =>
                                setData(
                                    'cover_photo_credit',
                                    event.target.value,
                                )
                            }
                        />
                    </div>
                    <div data-field="content" className="flex flex-col gap-2">
                        <RichTextEditor
                            label={text.content}
                            config="full"
                            value={data.content}
                            error={errors.content}
                            help={text.contentHelp}
                            onChange={(html) => setData('content', html)}
                            uploadFolder="articles"
                        />
                        <p
                            className="text-caption text-grey-dark"
                            aria-live="off"
                        >
                            {text.wordCount(
                                words,
                                Math.max(
                                    1,
                                    Math.ceil(words / WORDS_PER_MINUTE),
                                ),
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-8">
                    <section
                        aria-labelledby="classement"
                        className="border-primary flex flex-col gap-5 border-t-2 pt-3"
                    >
                        <h2
                            id="classement"
                            className="text-overline text-grey-dark font-semibold uppercase"
                        >
                            {text.classification}
                        </h2>
                        <div data-field="category_ids">
                            <CategoryPicker
                                categories={categories}
                                selectedIds={data.category_ids}
                                newNames={data.new_categories}
                                error={
                                    errors.category_ids ??
                                    errors['category_ids.0'] ??
                                    errors['new_categories.0']
                                }
                                onChange={(categoryIds, newNames) =>
                                    setData((current) => ({
                                        ...current,
                                        category_ids: categoryIds,
                                        new_categories: newNames,
                                    }))
                                }
                            />
                        </div>
                    </section>

                    <section
                        aria-labelledby="referencement"
                        className="border-primary flex flex-col gap-5 border-t-2 pt-3"
                    >
                        <h2
                            id="referencement"
                            className="text-overline text-grey-dark font-semibold uppercase"
                        >
                            {text.seo}
                        </h2>
                        <DescriptionField
                            value={data.description}
                            error={errors.description}
                            onChange={(value) => setData('description', value)}
                        />
                        <div data-field="keywords">
                            <TextField
                                label={text.keywords}
                                name="keywords"
                                value={data.keywords}
                                help={text.keywordsHelp}
                                error={errors.keywords}
                                onChange={(event) =>
                                    setData('keywords', event.target.value)
                                }
                            />
                        </div>
                        <div data-field="slug">
                            <TextField
                                label={text.slug}
                                name="slug"
                                value={data.slug}
                                maxLength={255}
                                help={text.slugHelp}
                                error={errors.slug}
                                autoCapitalize="off"
                                spellCheck={false}
                                onChange={(event) => {
                                    setIsSlugEdited(true);
                                    setData('slug', event.target.value);
                                }}
                                trailing={
                                    <span
                                        aria-hidden="true"
                                        className="text-body text-grey-dark pointer-events-none absolute inset-y-0 left-4 flex items-center"
                                    >
                                        /articles/
                                    </span>
                                }
                                className="pl-21"
                            />
                        </div>
                    </section>
                </div>

                <div className="tablet:flex laptop:col-span-2 border-grey-light hidden justify-end gap-3 border-t pt-6">
                    {actionButtons}
                </div>
            </form>

            <div
                className={cn(
                    'tablet:hidden -mx-gutter border-grey-light px-gutter sticky bottom-0 z-10 mt-6 grid gap-2 border-t bg-white py-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.15)]',
                    isPublished ? 'grid-cols-1' : 'grid-cols-2',
                )}
            >
                {actionButtons}
            </div>

            {/* The saved article, as in the list; publishing or archiving there reloads the status shown here. */}
            <ArticlePreviewPanel
                article={
                    article && isPreviewOpen
                        ? {
                              id: article.id,
                              title: article.title,
                              status: article.status,
                              previewUrl: article.previewUrl,
                          }
                        : null
                }
                onClose={() => setIsPreviewOpen(false)}
                isFromEditor
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
        </>
    );
}

function DescriptionField({
    value,
    error,
    onChange,
}: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const helpId = 'description-seo-aide';
    const errorId = 'description-seo-erreur';

    return (
        <div data-field="description" className="flex flex-col gap-2">
            <label
                htmlFor="description-seo"
                className="text-body-small text-primary font-semibold"
            >
                {text.description}
            </label>
            <textarea
                id="description-seo"
                name="description"
                rows={4}
                maxLength={160}
                value={value}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={[helpId, error ? errorId : null]
                    .filter(Boolean)
                    .join(' ')}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                    'border-grey-medium text-body text-primary focus:border-primary w-full resize-y rounded-md border bg-white px-4 py-3',
                    error && 'border-red-600 ring-1 ring-red-600',
                )}
            />
            <p id={helpId} className="text-caption text-grey-dark">
                {text.descriptionHelp(value.length)}
            </p>
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </div>
    );
}
