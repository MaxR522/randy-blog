/** Elapsed or total time as `1:24`, as on the board (whole seconds, rounded down). */
export function playerClock(seconds: number): string {
    const whole = Math.max(0, Math.floor(seconds));

    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Played share of the file, in percent. */
export function progressOf(current: number, total: number): number {
    return total > 0 ? Math.min(100, (current / total) * 100) : 0;
}

/** Whole minutes announced on the idle button, at least 1. */
export function listenMinutesOf(duration: number): number {
    return Math.max(1, Math.ceil(duration / 60));
}
