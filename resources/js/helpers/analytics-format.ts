const numberFormat = new Intl.NumberFormat('fr-FR');

/** « 3 482 », with a narrow no-break space between the thousands. */
export function formatNumber(value: number): string {
    return numberFormat.format(value);
}

/** « 1 min 42 s », « 42 s ». */
export function formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return minutes > 0 ? `${minutes} min ${seconds} s` : `${seconds} s`;
}

/** Formats a `YYYY-MM-DD` date as the calendar day it names, whatever the browser's timezone. */
export function formatDay(
    isoDate: string,
    options: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat('fr-FR', {
        ...options,
        timeZone: 'UTC',
    }).format(new Date(`${isoDate}T00:00:00Z`));
}
