import { AudioUploader } from '@/components/admin/audio-uploader';
import { ImageUploader } from '@/components/admin/image-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TextField } from '@/components/admin/text-field';
import type { ArticleEditorForm } from '@/lib/article-editor-form';
import { readingMinutes } from '@/lib/article-editor';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type ContentFieldsProps = {
    editor: ArticleEditorForm;
    /** Length of the saved audio, from Cloudinary. */
    audioDuration: number | null;
};

/**
 * Main column: title, chapô, cover and its credit, audio, and the text with its word count.
 * Each field sits in a `data-field` box so a save error can focus it.
 */
export function ContentFields({ editor, audioDuration }: ContentFieldsProps) {
    const { data, errors, setData, words } = editor;

    return (
        <div className="flex min-w-0 flex-col gap-7">
            <div data-field="title">
                <TextField
                    label={text.title}
                    name="title"
                    value={data.title}
                    maxLength={255}
                    error={errors.title}
                    onChange={(event) => editor.changeTitle(event.target.value)}
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
                    existingUrl={editor.existingCover}
                    error={errors.cover}
                    onChange={editor.changeCover}
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
                        setData('cover_photo_credit', event.target.value)
                    }
                />
            </div>
            <div data-field="audio">
                <AudioUploader
                    label={text.audio}
                    value={data.audio}
                    existingUrl={editor.existingAudio}
                    existingDuration={audioDuration}
                    progress={editor.uploadPercentage}
                    error={errors.audio}
                    onChange={editor.changeAudio}
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
                <p className="text-caption text-grey-dark" aria-live="off">
                    {text.wordCount(words, readingMinutes(words))}
                </p>
            </div>
        </div>
    );
}
