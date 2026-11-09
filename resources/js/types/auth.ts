export type User = {
    id: number;
    avatar: string | null;
};

export type Auth = {
    user: User | null;
};
