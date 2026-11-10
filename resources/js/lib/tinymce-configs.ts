import type { Editor } from '@tinymce/tinymce-react';
import type { ComponentProps } from 'react';
import type { RawEditorOptions } from 'tinymce';
import { store as uploadImage } from '@/actions/App/Http/Controllers/Admin/MediaController';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.richText;

/** `init` of the React component, which sets the target, the licence key and the disabled state itself. */
export type EditorInit = NonNullable<ComponentProps<typeof Editor>['init']>;

/**
 * `full` for the article body, `minimal` for the chapô and the biography, `newsletter` for the composer (ADM-ART-55).
 */
export type RichTextConfig = 'full' | 'minimal' | 'newsletter';

/** Cloudinary folders an editor image may go to (`App\MediaFolder`, limited by `MediaUploadRequest`). */
export type UploadFolder = 'articles' | 'newsletters';

function xsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

/**
 * Sends an inserted image to the authenticated endpoint, which stores it on Cloudinary (ADM-ART-53).
 * A rejection removes the placeholder image and shows the French message in TinyMCE's notification.
 */
function uploadHandler(
    folder: UploadFolder,
): RawEditorOptions['images_upload_handler'] {
    return async (blobInfo) => {
        const body = new FormData();
        body.append('image', blobInfo.blob(), blobInfo.filename());
        body.append('folder', folder);

        let response: Response;

        try {
            response = await fetch(uploadImage.url(), {
                method: 'POST',
                body,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            throw { message: text.uploadFailed, remove: true };
        }

        const payload = (await response.json().catch(() => ({}))) as {
            location?: string;
            message?: string;
            errors?: Record<string, string[]>;
        };

        if (response.ok && payload.location) {
            return payload.location;
        }

        const message =
            response.status === 419
                ? text.sessionExpired
                : (Object.values(payload.errors ?? {})[0]?.[0] ??
                  payload.message ??
                  text.uploadFailed);

        throw { message, remove: true };
    };
}

/**
 * Options every editor shares: French UI, self-hosted GPL build, the public article styles inside the editor.
 */
function sharedOptions(contentStyle: string): EditorInit {
    return {
        language: 'fr-FR',
        menubar: false,
        branding: false,
        promotion: false,
        entity_encoding: 'raw',
        body_class: 'article-body',
        // Only the article page's styles: TinyMCE's default content skin would override them.
        content_css: false,
        content_style: contentStyle,
        link_default_target: '_blank',
        link_assume_external_targets: 'https',
        toolbar_mode: 'sliding',
        convert_urls: false,
        relative_urls: false,
    };
}

function imageOptions(folder: UploadFolder): EditorInit {
    return {
        images_upload_handler: uploadHandler(folder),
        images_file_types: 'jpg,jpeg,png,gif,webp',
        automatic_uploads: true,
        image_caption: true,
        image_dimensions: true,
        // Alt text field with a « décorative » checkbox (A11Y-IMG-2).
        a11y_advanced_options: true,
        paste_data_images: true,
    };
}

/**
 * TinyMCE options for one of the three configurations. `contentStyle` is the CSS of the article page.
 */
export function tinymceOptions(
    config: RichTextConfig,
    contentStyle: string,
    uploadFolder: UploadFolder = config === 'newsletter'
        ? 'newsletters'
        : 'articles',
): EditorInit {
    const shared = sharedOptions(contentStyle);

    if (config === 'minimal') {
        return {
            ...shared,
            body_class: 'article-body is-minimal',
            height: 180,
            min_height: 140,
            plugins: ['link', 'autoresize'],
            toolbar: 'undo redo | bold italic | link unlink',
            statusbar: false,
            autoresize_bottom_margin: 16,
            // Autoresize sets the side padding of the body itself (1 px by default).
            autoresize_overflow_padding: 16,
            // A chapô or a biography has no headings or other blocks.
            valid_elements: 'p,br,strong/b,em/i,a[href|target|rel|title]',
        };
    }

    if (config === 'newsletter') {
        return {
            ...shared,
            ...imageOptions(uploadFolder),
            height: 520,
            plugins: ['image', 'lists', 'link', 'autoresize'],
            toolbar:
                'undo redo | blocks | bold italic | numlist bullist | link unlink | image',
            block_formats: text.newsletterBlockFormats,
            max_height: 900,
            autoresize_overflow_padding: 16,
        };
    }

    return {
        ...shared,
        ...imageOptions(uploadFolder),
        height: 600,
        plugins: [
            'image',
            'fullscreen',
            'lists',
            'advlist',
            'link',
            'media',
            'table',
            'wordcount',
        ],
        // V1 toolbar (spec Appendix B) with `styles` for the Encadré (ADM-ART-50).
        toolbar:
            'undo redo | blocks styles | bold italic | alignleft aligncenter alignright alignjustify | numlist bullist | outdent indent | image media fullscreen | link unlink | table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
        block_formats: text.blockFormats,
        style_formats: [
            {
                title: text.encadre,
                block: 'div',
                classes: 'callout-box',
                wrapper: true,
            },
        ],
        // A header row of `<th scope="col">` by default (A11Y-BODY-2).
        table_header_type: 'sectionCells',
        table_default_attributes: {},
        table_default_styles: { width: '100%' },
        table_use_colgroups: false,
        table_sizing_mode: 'relative',
        media_alt_source: false,
        media_poster: false,
        media_dimensions: false,
    };
}
