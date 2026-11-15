/** The composer fields the preview renders. */
export type NewsletterPreviewFields = {
    subject: string;
    preheader: string;
    content: string;
};

/** Width of the preview frame. */
export type PreviewFormat = 'desktop' | 'mobile';

export const previewFormats: PreviewFormat[] = ['desktop', 'mobile'];
