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
