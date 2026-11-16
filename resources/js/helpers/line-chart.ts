export type ChartPoint = { date: string; views: number };

export const HEIGHT = 244;
export const MARGIN = { top: 20, right: 20, bottom: 28, left: 48 };
export const TICK_SPACING = 110;
export const DEFAULT_WIDTH = 828;
/** Narrowest drawing, in pixels, so the axis labels never overlap. */
export const MIN_WIDTH = 280;
export const TOOLTIP_WIDTH = 156;

/** Rounds the top of the axis up to 1, 2, 2.5 or 5 times a power of ten, so the gridlines fall on round numbers. */
export function niceMax(value: number): number {
    if (value <= 0) {
        return 4;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].find(
        (factor) => factor * magnitude >= value,
    );

    return (step ?? 10) * magnitude;
}

/** Highest and lowest daily views, with the first day each happened. */
export function extremesOf(data: ChartPoint[]) {
    const views = data.map((point) => point.views);
    const peak = Math.max(0, ...views);
    const lowest = views.length === 0 ? 0 : Math.min(...views);

    return {
        peak,
        lowest,
        peakPoint: data.find((point) => point.views === peak),
        lowestPoint: data.find((point) => point.views === lowest),
    };
}

/** Scales, line, area, gridlines and tick spacing of the chart drawn `width` pixels wide. */
export function chartGeometryOf(
    data: ChartPoint[],
    width: number,
    peak: number,
) {
    const top = niceMax(peak);
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (index: number) =>
        MARGIN.left +
        (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = (value: number) =>
        MARGIN.top + plotHeight - (value / top) * plotHeight;
    const points = data.map((point, index) => `${x(index)},${y(point.views)}`);

    return {
        plotWidth,
        x,
        y,
        points,
        area: `M${x(0)},${y(0)} L${points.join(' L')} L${x(data.length - 1)},${y(0)} Z`,
        gridValues: [0, 1, 2, 3, 4].map((step) => (top / 4) * step),
        tickEvery: Math.max(
            1,
            Math.ceil(data.length / Math.floor(plotWidth / TICK_SPACING)),
        ),
    };
}

/** Left edge of the tooltip: on the side of the crosshair that has room. */
export function tooltipXOf(crosshairX: number, width: number): number {
    return crosshairX + TOOLTIP_WIDTH + 12 > width - MARGIN.right
        ? crosshairX - TOOLTIP_WIDTH - 12
        : crosshairX + 12;
}

/** The day an arrow, Home or End key moves to, or `undefined` for any other key. */
export function keyMoveOf(
    key: string,
    count: number,
): ((index: number) => number) | undefined {
    const moves: Record<string, (index: number) => number> = {
        ArrowRight: (index) => Math.min(count - 1, index + 1),
        ArrowLeft: (index) => Math.max(0, index - 1),
        Home: () => 0,
        End: () => count - 1,
    };

    return moves[key];
}
