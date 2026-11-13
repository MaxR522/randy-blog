import type { KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { formatDay, formatNumber } from '@/lib/analytics-format';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics.chart;

type Point = { date: string; views: number };

const HEIGHT = 244;
const MARGIN = { top: 20, right: 20, bottom: 28, left: 48 };
const TICK_SPACING = 110;
const DEFAULT_WIDTH = 828;

/** Rounds the top of the axis up to 1, 2, 2.5 or 5 times a power of ten, so the gridlines fall on round numbers. */
function niceMax(value: number): number {
    if (value <= 0) {
        return 4;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].find(
        (factor) => factor * magnitude >= value,
    );

    return (step ?? 10) * magnitude;
}

type LineChartProps = {
    data: Point[];
};

/**
 * Page views per day (ADM-ANA-3): one series, so no legend and the title names it. Crosshair and tooltip follow the
 * pointer or the arrow keys, the same figures are available as a table, and the SVG is drawn at its real pixel width so
 * the text stays 12 px on a phone.
 */
export function LineChart({ data }: LineChartProps) {
    const hintId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isTable, setIsTable] = useState(false);

    useEffect(() => {
        const container = containerRef.current;

        if (container === null) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.max(280, Math.round(entry.contentRect.width)));
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, [isTable]);

    const longDay = (date: string) =>
        formatDay(date, { day: 'numeric', month: 'long', year: 'numeric' });
    const shortDay = (date: string) =>
        formatDay(date, { day: 'numeric', month: 'short' });

    const views = data.map((point) => point.views);
    const peak = Math.max(0, ...views);
    const lowest = views.length === 0 ? 0 : Math.min(...views);
    const peakPoint = data.find((point) => point.views === peak);
    const lowestPoint = data.find((point) => point.views === lowest);

    if (data.length === 0 || peak === 0) {
        return <p className="text-body-small text-grey-dark">{text.empty}</p>;
    }

    const top = niceMax(peak);
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (index: number) =>
        MARGIN.left +
        (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = (value: number) =>
        MARGIN.top + plotHeight - (value / top) * plotHeight;

    const points = data.map((point, index) => `${x(index)},${y(point.views)}`);
    const area = `M${x(0)},${y(0)} L${points.join(' L')} L${x(data.length - 1)},${y(0)} Z`;
    const gridValues = [0, 1, 2, 3, 4].map((step) => (top / 4) * step);
    const tickEvery = Math.max(
        1,
        Math.ceil(data.length / Math.floor(plotWidth / TICK_SPACING)),
    );
    const active = activeIndex === null ? null : data[activeIndex];

    const moveTo = (event: PointerEvent<HTMLDivElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left - MARGIN.left) / plotWidth;

        setActiveIndex(
            Math.min(
                data.length - 1,
                Math.max(0, Math.round(ratio * (data.length - 1))),
            ),
        );
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const moves: Record<string, (index: number) => number> = {
            ArrowRight: (index) => Math.min(data.length - 1, index + 1),
            ArrowLeft: (index) => Math.max(0, index - 1),
            Home: () => 0,
            End: () => data.length - 1,
        };
        const move = moves[event.key];

        if (move !== undefined) {
            event.preventDefault();
            setActiveIndex((index) => move(index ?? data.length - 1));
        }
    };

    // Tooltip on the side of the crosshair that has room.
    const tooltipWidth = 156;
    const tooltipX =
        activeIndex !== null &&
        x(activeIndex) + tooltipWidth + 12 > width - MARGIN.right
            ? x(activeIndex) - tooltipWidth - 12
            : (activeIndex === null ? 0 : x(activeIndex)) + 12;

    return (
        <div>
            <div className="mb-2 flex justify-end">
                <button
                    type="button"
                    onClick={() => setIsTable((value) => !value)}
                    className="text-body-small text-accent-600 inline-flex min-h-11 cursor-pointer items-center font-medium underline underline-offset-4"
                >
                    {isTable ? text.showChart : text.showTable}
                </button>
            </div>
            {isTable ? (
                <div className="max-h-96 overflow-auto">
                    <table className="text-body-small w-full border-collapse">
                        <caption className="sr-only">
                            {adminLabels.analytics.chart.title}
                        </caption>
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    className="border-primary text-overline text-grey-dark sticky top-0 border-b bg-white py-2.5 text-left font-semibold uppercase"
                                >
                                    {text.date}
                                </th>
                                <th
                                    scope="col"
                                    className="border-primary text-overline text-grey-dark sticky top-0 border-b bg-white py-2.5 text-right font-semibold uppercase"
                                >
                                    {text.views}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...data].reverse().map((point) => (
                                <tr key={point.date}>
                                    <td className="border-grey-light border-b py-2.5">
                                        {longDay(point.date)}
                                    </td>
                                    <td className="border-grey-light border-b py-2.5 text-right">
                                        {formatNumber(point.views)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    tabIndex={0}
                    role="group"
                    aria-label={text.title}
                    aria-describedby={hintId}
                    onPointerMove={moveTo}
                    onPointerLeave={() => setActiveIndex(null)}
                    onKeyDown={onKeyDown}
                    onBlur={() => setActiveIndex(null)}
                    className="rounded-sm"
                    style={{ touchAction: 'pan-y' }}
                >
                    <svg
                        width={width}
                        height={HEIGHT}
                        role="img"
                        aria-label={text.summary(
                            longDay(data[0].date),
                            longDay(data[data.length - 1].date),
                            `${formatNumber(peak)} le ${longDay(peakPoint?.date ?? data[0].date)}`,
                            `${formatNumber(lowest)} le ${longDay(lowestPoint?.date ?? data[0].date)}`,
                        )}
                        className="block font-sans text-xs"
                    >
                        {gridValues.map((value) => (
                            <g key={value}>
                                <line
                                    x1={MARGIN.left}
                                    x2={width - MARGIN.right}
                                    y1={y(value)}
                                    y2={y(value)}
                                    className={
                                        value === 0
                                            ? 'stroke-primary'
                                            : 'stroke-grey-light'
                                    }
                                />
                                <text
                                    x={MARGIN.left - 10}
                                    y={y(value) + 4}
                                    textAnchor="end"
                                    className="fill-grey-dark"
                                >
                                    {formatNumber(value)}
                                </text>
                            </g>
                        ))}
                        {data.map((point, index) =>
                            index % tickEvery === 0 ? (
                                <text
                                    key={point.date}
                                    x={x(index)}
                                    y={HEIGHT - 8}
                                    textAnchor="middle"
                                    className="fill-grey-dark"
                                >
                                    {shortDay(point.date)}
                                </text>
                            ) : null,
                        )}
                        <path d={area} className="fill-accent-600/10" />
                        <polyline
                            points={points.join(' ')}
                            fill="none"
                            strokeWidth={2}
                            strokeLinejoin="round"
                            className="stroke-accent-600"
                        />
                        {active !== null && activeIndex !== null && (
                            <g>
                                <line
                                    x1={x(activeIndex)}
                                    x2={x(activeIndex)}
                                    y1={MARGIN.top}
                                    y2={y(0)}
                                    strokeDasharray="3 3"
                                    className="stroke-grey-medium"
                                />
                                <circle
                                    cx={x(activeIndex)}
                                    cy={y(active.views)}
                                    r={5}
                                    strokeWidth={2}
                                    className="fill-accent-600 stroke-white"
                                />
                                <rect
                                    x={tooltipX}
                                    y={MARGIN.top - 2}
                                    width={tooltipWidth}
                                    height={48}
                                    rx={4}
                                    className="fill-primary"
                                />
                                <text
                                    x={tooltipX + 12}
                                    y={MARGIN.top + 18}
                                    fontSize={12}
                                    className="fill-grey-light"
                                >
                                    {longDay(active.date)}
                                </text>
                                <text
                                    x={tooltipX + 12}
                                    y={MARGIN.top + 37}
                                    fontSize={14}
                                    fontWeight={600}
                                    className="fill-white"
                                >
                                    {formatNumber(active.views)}{' '}
                                    {text.views.toLowerCase()}
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            )}
            <p id={hintId} className="sr-only">
                {text.hint}
            </p>
            <p className="sr-only" aria-live="polite">
                {active === null
                    ? ''
                    : `${longDay(active.date)} : ${formatNumber(active.views)} ${text.views.toLowerCase()}`}
            </p>
        </div>
    );
}
