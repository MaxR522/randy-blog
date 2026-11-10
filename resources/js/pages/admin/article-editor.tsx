import type { ReactNode } from 'react';
import { useState } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { ImageUploader } from '@/components/admin/image-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { StatusBadge } from '@/components/admin/status-badge';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

/**
 * Article editor (ADM-ART-10…30). This first version holds the fields built in session 4 of the roadmap;
 * saving, categories, SEO fields and the header actions come in session 5.
 */
export default function ArticleEditor() {
    const [title, setTitle] = useState('');
    const [chapo, setChapo] = useState('');
    const [cover, setCover] = useState<File | null>(null);
    const [coverCredit, setCoverCredit] = useState('');
    const [content, setContent] = useState('');

    return (
        <>
            <AdminHead title={text.createTitle} />
            <div className="tablet:mb-6 tablet:flex-row tablet:items-center tablet:justify-between mb-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-h2">{text.createTitle}</h1>
                    <StatusBadge variant="neutral">
                        {adminLabels.articles.status.DRAFT}
                    </StatusBadge>
                </div>
                <Button disabled>{text.save}</Button>
            </div>

            <form
                className="flex flex-col gap-7"
                onSubmit={(event) => event.preventDefault()}
            >
                <TextField
                    label={text.title}
                    name="title"
                    value={title}
                    maxLength={255}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-14 text-[1.375rem] font-semibold"
                />
                <RichTextEditor
                    label={text.chapo}
                    config="minimal"
                    value={chapo}
                    onChange={setChapo}
                />
                <ImageUploader
                    label={text.cover}
                    value={cover}
                    onChange={setCover}
                />
                <TextField
                    label={text.coverCredit}
                    name="cover_photo_credit"
                    value={coverCredit}
                    maxLength={255}
                    onChange={(event) => setCoverCredit(event.target.value)}
                />
                <RichTextEditor
                    label={text.content}
                    config="full"
                    value={content}
                    onChange={setContent}
                    uploadFolder="articles"
                />
            </form>
        </>
    );
}

ArticleEditor.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
