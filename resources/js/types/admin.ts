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

export type AccountSecurity = {
    recoveryEmail: string | null;
    recoveryEmailVerified: boolean;
    /** E.164, such as « +261340000000 ». */
    recoveryPhone: string | null;
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
