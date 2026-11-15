import { SeoSuggestions } from '@/components/admin/seo-suggestions';
import { TextAreaField } from '@/components/admin/text-area-field';
import { TextField } from '@/components/admin/text-field';
import type { ArticleEditorForm } from '@/hooks/use-article-editor-form';
import { adminLabels } from '@/lib/labels.admin.fr';
import { SidebarSection } from '@/components/admin/article-editor/sidebar-section';

const text = adminLabels.editor;

type SeoFieldsProps = {
    editor: ArticleEditorForm;
};

/**
 * « Référencement »: suggestions, meta description, keywords and the article URL.
 */
export function SeoFields({ editor }: SeoFieldsProps) {
    const { data, errors, setData } = editor;

    return (
        <SidebarSection id="referencement" title={text.seo}>
            <SeoSuggestions
                title={data.title}
                leadParagraph={data.lead_paragraph}
                content={data.content}
                hasContent={editor.words > 0}
                hasCurrentValues={
                    data.description.trim() !== '' ||
                    data.keywords.trim() !== ''
                }
                onSuggest={editor.applySeoSuggestions}
            />
            <div data-field="description">
                <TextAreaField
                    label={text.description}
                    name="description"
                    rows={4}
                    maxLength={160}
                    value={data.description}
                    help={text.descriptionHelp(data.description.length)}
                    error={errors.description}
                    onChange={(event) =>
                        setData('description', event.target.value)
                    }
                />
            </div>
            <div data-field="keywords">
                <TextAreaField
                    label={text.keywords}
                    name="keywords"
                    rows={3}
                    value={data.keywords}
                    help={text.keywordsHelp}
                    error={errors.keywords}
                    onChange={(event) =>
                        editor.changeKeywords(event.target.value)
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
                    onChange={(event) => editor.changeSlug(event.target.value)}
                    trailing={
                        <span
                            aria-hidden="true"
                            className="text-body text-grey-dark pointer-events-none absolute inset-y-0 left-4 flex items-center"
                        >
                            /
                        </span>
                    }
                    className="pl-7"
                />
            </div>
        </SidebarSection>
    );
}
