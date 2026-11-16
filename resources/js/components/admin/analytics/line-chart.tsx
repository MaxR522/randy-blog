import { useId } from 'react';
import { formatDay, formatNumber } from '@/helpers/analytics-format';
import type { ChartPoint } from '@/helpers/line-chart';
import {
    chartGeometryOf,
    extremesOf,
    HEIGHT,
    MARGIN,
    TOOLTIP_WIDTH,
    tooltipXOf,
} from '@/helpers/line-chart';
import { useLineChart } from '@/hooks/use-line-chart';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics.chart;

type LineChartProps = {
    data: ChartPoint[];
};

/**
 * Page views per day (ADM-ANA-3): one series, so no legend and the title names it. Crosshair and tooltip follow the
 * pointer or the arrow keys, the same figures are available as a table, and the SVG is drawn at its real pixel width so
 * the text stays 12 px on a phone.
 */
export function LineChart({ data }: LineChartProps) {
    const hintId = useId();
    const chart = useLineChart(data.length);
    const { width, activeIndex, isTable } = chart;

    const longDay = (date: string) =>
        formatDay(date, { day: 'numeric', month: 'long', year: 'numeric' });
    const shortDay = (date: string) =>
        formatDay(date, { day: 'numeric', month: 'short' });

    const { peak, lowest, peakPoint, lowestPoint } = extremesOf(data);

    if (data.length === 0 || peak === 0) {
        return <p className="text-body-small text-grey-dark">{text.empty}</p>;
    }

    const { plotWidth, x, y, points, area, gridValues, tickEvery } =
        chartGeometryOf(data, width, peak);
    const active = activeIndex === null ? null : data[activeIndex];
    const tooltipX =
        activeIndex === null ? 12 : tooltipXOf(x(activeIndex), width);

    return (
        <div>
            <div className="mb-2 flex justify-end">
                <button
                    type="button"
                    onClick={chart.toggleTable}
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
                    ref={chart.containerRef}
                    tabIndex={0}
                    role="group"
                    aria-label={text.title}
                    aria-describedby={hintId}
                    onPointerMove={(event) => chart.moveTo(event, plotWidth)}
                    onPointerLeave={chart.clearActive}
                    onKeyDown={chart.handleKeyDown}
                    onBlur={chart.clearActive}
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
                                    width={TOOLTIP_WIDTH}
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
