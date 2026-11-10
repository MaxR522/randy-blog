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
