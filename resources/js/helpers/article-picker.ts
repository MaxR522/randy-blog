/**
 * A published article as `NewsletterController::articles` lists it.
 */
export type PickedArticle = {
    id: number;
    title: string;
    dateLabel: string | null;
    thumbnail: string | null;
    chapo: string;
};

/**
 * Index the listbox selection moves to for an arrow, Home or End key, or `null` for any other key.
 */
export function selectionMoveOf(
    key: string,
    index: number,
    length: number,
): number | null {
    const moves: Record<string, number> = {
        ArrowDown: Math.min(index + 1, length - 1),
        ArrowUp: Math.max(index - 1, 0),
        Home: 0,
        End: length - 1,
    };

    return key in moves ? moves[key] : null;
}
