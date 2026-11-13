/**
 * One page of an admin list, as the controllers build it.
 */
export type AdminList<Row> = {
    data: Row[];
    total: number;
    currentPage: number;
    lastPage: number;
    previousUrl: string | null;
    nextUrl: string | null;
};

export type SortDirection = 'asc' | 'desc';

/**
 * A category as the article editor's picker lists it.
 */
export type CategoryOption = { id: number; name: string };

/**
 * A saved article as the editor loads it (`AdminArticleEditorResource`).
 */
export type EditorArticle = {
    id: number;
    title: string;
    slug: string;
    leadParagraph: string;
    content: string;
    coverPhoto: string | null;
    coverPhotoCredit: string;
    description: string;
    keywords: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    categoryIds: number[];
    isPublished: boolean;
    isSlugFrozen: boolean;
    previewUrl: string;
    updatedAt: string | null;
};

/**
 * The fields a Word document fills, with what the check found (`App\Support\WordImport`).
 */
export type WordImportResult = {
    fields: { title: string; lead_paragraph: string; content: string };
    errors: string[];
    warnings: string[];
    summary: {
        leadParagraphs: number;
        words: number;
        headings: number;
        callouts: number;
    };
};

/**
 * What « Générer avec l’IA » proposes for the SEO fields (`App\Support\ArticleSuggester`).
 */
export type ArticleSuggestions = { description: string; keywords: string };

/**
 * The author's own fields on the account Profile tab.
 */
export type AccountDevice = {
    /** Keyed hash of the session ID: the ID itself never reaches the page. */
    key: string;
    /** « Firefox · Linux · ordinateur » */
    device: string;
    /** « Firefox · Linux » */
    shortDevice: string;
    ip: string | null;
    /** « Maintenant », « Il y a 2 heures », « 3 novembre 2026 » */
    lastActivity: string;
    isCurrent: boolean;
};

export type AccountLoginEvent = {
    id: number;
    /** « 7 novembre 2026, 09 h 12 » */
    date: string;
    /** « 7 nov. 2026, 09 h 12 » */
    shortDate: string;
    device: string;
    ip: string | null;
    succeeded: boolean;
    twoFactorUsed: boolean;
};

/**
 * The 2FA row: QR code and key only while the setup waits for its first code.
 */
export type AccountTwoFactor = {
    enabled: boolean;
    pending: boolean;
    qrCodeSvg: string | null;
    secretKey: string | null;
};

export type AccountSecurity = {
    recoveryEmail: string | null;
    recoveryEmailVerified: boolean;
    /** E.164, such as « +261340000000 ». */
    recoveryPhone: string | null;
    twoFactor: AccountTwoFactor;
    devices: AccountDevice[];
    loginEvents: AccountLoginEvent[];
};

export type AccountProfile = {
    avatar: string | null;
    avatarCredit: string | null;
    displayName: string | null;
    /** Stored HTML, for the editor. */
    bio: string;
    /** HTML as the author page renders it. */
    bioHtml: string;
    email: string;
};

export type NewsletterStatus =
    | 'draft'
    | 'sending'
    | 'sent'
    | 'partially_failed';

/**
 * A newsletter as the admin lists and edits it (`AdminNewsletterResource`).
 */
export type AdminNewsletter = {
    id: number;
    subject: string;
    preheader: string | null;
    status: NewsletterStatus;
    audience: 'all' | 'selection';
    sentAtLabel: string | null;
    sentAtShortLabel: string | null;
    recipientsCount: number;
    sentCount: number;
    failedCount: number;
};
