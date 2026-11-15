import { CategoryPicker } from '@/components/admin/category-picker';
import type { ArticleEditorForm } from '@/lib/article-editor-form';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { CategoryOption } from '@/types/admin';
import { SidebarSection } from '@/components/admin/article-editor/sidebar-section';

type ClassificationFieldsProps = {
    editor: ArticleEditorForm;
    categories: CategoryOption[];
};

/**
 * « Classement »: existing and new categories.
 */
export function ClassificationFields({
    editor,
    categories,
}: ClassificationFieldsProps) {
    const { data, errors } = editor;

    return (
        <SidebarSection
            id="classement"
            title={adminLabels.editor.classification}
        >
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
                    onChange={editor.changeCategories}
                />
            </div>
        </SidebarSection>
    );
}
