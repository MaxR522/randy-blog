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

export type CategorySection = {
    id: number;
    name: string;
    articles: ArticleCard[];
};

export type ScrollProp<T> = {
    data: T[];
};
