export type ArticleCategory = {
    id: number;
    name: string;
};

export type ArticleCard = {
    id: number;
    title: string;
    url: string;
    cover: string | null;
    chapo: string;
    date: string | null;
    dateLabel: string | null;
    categories: ArticleCategory[];
};

export type ExcerptSegment = {
    text: string;
    highlighted: boolean;
};

export type SearchResult = ArticleCard & {
    readingTime: number;
    excerpt: ExcerptSegment[];
};

export type SearchResults = {
    data: SearchResult[];
    total: number;
    currentPage: number;
    lastPage: number;
    previousUrl: string | null;
    nextUrl: string | null;
};

export type ArticleAuthor = {
    name: string;
    url: string;
};

export type ArticleDetail = {
    id: number;
    title: string;
    url: string;
    description: string;
    cover: string | null;
    coverAlt: string;
    coverCredit: string | null;
    chapoHtml: string;
    contentHtml: string;
    date: string | null;
    dateLabel: string | null;
    readingTime: number;
    categories: ArticleCategory[];
    author: ArticleAuthor | null;
};

export type CategorySection = {
    id: number;
    name: string;
    articles: ArticleCard[];
};

export type ScrollProp<T> = {
    data: T[];
};
