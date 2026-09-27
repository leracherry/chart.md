import { useId, type HTMLAttributes, type SVGProps } from 'react';
import type { ChartDefinition } from './types.js';

const palette = [
  '#7856a6',
  '#3975ad',
  '#298078',
  '#a46d35',
  '#ac5674',
  '#687c37',
];
/** Additional series receive generated hues instead of cycling the six defaults. */
export function seriesColor(index: number): string {
  const fallback =
    palette[index] ??
    `hsl(${((index - 6) * 137.508 + 265).toFixed(3)}, 38%, 48%)`;
  return `var(--chartmd-series-${index + 1}, ${fallback})`;
}

/** Optional legacy pattern styles; the default presentation uses plain lines. */
export const lineStyles = [
  { name: 'Solid · circle', dash: '', shape: 'circle' },
  { name: 'Dashed · square', dash: '7 4', shape: 'square' },
  { name: 'Dotted · diamond', dash: '1 4', shape: 'diamond' },
  { name: 'Dash-dot · triangle', dash: '8 4 1 4', shape: 'triangle' },
  { name: 'Long dash · plus', dash: '12 5', shape: 'plus' },
  { name: 'Short dash · cross', dash: '3 3', shape: 'cross' },
] as const;
export interface ChartProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  definition?: ChartDefinition;
  'data-chart'?: string;
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  patterns?: boolean;
}
function validate(value: unknown): asserts value is ChartDefinition {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid chart definition');
  const d = value as ChartDefinition;
  if (
    !['bar', 'line'].includes(d.type) ||
    !Array.isArray(d.labels) ||
    !d.labels.length ||
    !d.labels.every((v) => typeof v === 'string') ||
    !Array.isArray(d.series) ||
    !d.series.length ||
    !d.series.every(
      (s) =>
        s &&
        typeof s.name === 'string' &&
        Array.isArray(s.values) &&
        s.values.length === d.labels.length &&
        s.values.every(
          (v) =>
            Number.isFinite(v) &&
            Math.abs(v) <= 1e12 &&
            (v === 0 || Math.abs(v) >= 1e-12),
        ),
    ) ||
    [d.title, d.x, d.y].some((v) => v !== undefined && typeof v !== 'string') ||
    (d.grid !== undefined &&
      !['both', 'horizontal', 'paper', 'none'].includes(d.grid))
  )
    throw new Error('Invalid chart definition');
}
function Marker({ index, x, y }: { index: number; x: number; y: number }) {
  const shape = lineStyles[index % 6]!.shape;
  return (
    <g
      transform={`translate(${x} ${y})`}
      className="chartmd__marker"
      data-marker={shape}
    >
      {shape === 'circle' && <circle r="3" />}
      {shape === 'square' && <rect x="-3" y="-3" width="6" height="6" />}
      {shape === 'diamond' && <path d="M0 -4 4 0 0 4 -4 0Z" />}
      {shape === 'triangle' && <path d="M0 -4 4 3 -4 3Z" />}
      {shape === 'plus' && (
        <path
          d="M-4 0H4M0 -4V4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
      {shape === 'cross' && (
        <path
          d="M-3 -3 3 3M-3 3 3 -3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </g>
  );
}
export function Chart({
  definition: supplied,
  'data-chart': serialized,
  locale = 'en',
  numberFormat,
  patterns = false,
  className,
  style,
  ...props
}: ChartProps) {
  const definition: unknown = supplied ?? JSON.parse(serialized ?? 'null');
  validate(definition);
  const d = definition;
  const id = `chartmd-${useId().replaceAll(':', '')}`;
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    ...numberFormat,
  });
  const format = (v: number) => {
    if (!numberFormat && v !== 0 && Math.abs(v) < 0.01) {
      return new Intl.NumberFormat(locale, {
        notation: 'scientific',
        maximumFractionDigits: 2,
      }).format(v);
    }
    return formatter.format(Object.is(v, -0) ? 0 : v);
  };
  let low = 0;
  let high = 0;
  for (const s of d.series)
    for (const v of s.values) {
      low = Math.min(low, v);
      high = Math.max(high, v);
    }
  const rough = (high - low || 1) / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((n) => n * power >= rough) ?? 10) * power;
  low = Math.floor(low / step) * step;
  high = Math.ceil(high / step) * step;
  if (high === low) high = low + step;
  const ticks = Array.from(
    { length: Math.round((high - low) / step) + 1 },
    (_, i) => low + i * step,
  );
  const width = 720;
  const left = Math.max(
    72,
    Math.min(200, Math.max(...ticks.map((v) => format(v).length)) * 7 + 28),
  );
  const top = d.title ? 52 : 24;
  const bottom = 300;
  const plotWidth = width - left - 24;
  const category = plotWidth / d.labels.length;
  const x = (i: number) => left + category * (i + 0.5);
  const y = (v: number) => bottom - ((v - low) / (high - low)) * (bottom - top);
  const legendTop = bottom + (d.x ? 70 : 48);
  const height =
    legendTop +
    (d.series.length > 1 ? Math.ceil(d.series.length / 3) * 26 : 0) +
    14;
  const title = d.title ?? `${d.type === 'line' ? 'Line' : 'Bar'} chart`;
  const shorten = (v: string, length: number) =>
    v.length > length ? `${v.slice(0, length - 1)}…` : v;
  const stride = Math.max(1, Math.ceil(d.labels.length / 8));
  return (
    <svg
      {...props}
      className={['chartmd', className].filter(Boolean).join(' ')}
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>
        {d.series
          .map(
            (s) =>
              `${s.name}. ${d.labels.map((label, i) => `${label}: ${s.values[i]}`).join(', ')}`,
          )
          .join('. ')}
      </desc>
      <defs>
        <pattern
          id={`${id}-paper`}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          x={left}
          y={top}
        >
          <path
            d="M16 0H0V16"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      {d.title && (
        <text className="chartmd__title" x={left} y="24">
          {shorten(d.title, 65)}
          <title>{d.title}</title>
        </text>
      )}
      {d.grid === 'paper' && (
        <rect
          className="chartmd__paper"
          x={left}
          y={top}
          width={plotWidth}
          height={bottom - top}
          fill={`url(#${id}-paper)`}
        />
      )}
      {ticks.map((value, i) => (
        <g key={i}>
          {d.grid !== 'none' && (
            <line
              className="chartmd__grid"
              x1={left}
              x2={width - 24}
              y1={y(value)}
              y2={y(value)}
            />
          )}
          <text
            className="chartmd__label chartmd__number"
            x={left - 10}
            y={y(value) + 4}
            textAnchor="end"
          >
            {format(value)}
          </text>
        </g>
      ))}
      {(d.grid === undefined || d.grid === 'both') &&
        d.labels.map(
          (_, i) =>
            i % stride === 0 && (
              <line
                key={`vertical-${i}`}
                className="chartmd__grid"
                data-grid="vertical"
                x1={x(i)}
                x2={x(i)}
                y1={top}
                y2={bottom}
              />
            ),
        )}
      {d.grid === 'none' && (
        <line
          className="chartmd__axis"
          x1={left}
          x2={width - 24}
          y1={y(0)}
          y2={y(0)}
        />
      )}
      {d.series.map((s, si) => (
        <g
          key={si}
          className="chartmd__series"
          style={{ color: seriesColor(si) }}
        >
          {d.type === 'line' ? (
            <>
              <polyline
                className="chartmd__line"
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                strokeDasharray={
                  patterns ? lineStyles[si % 6]!.dash : undefined
                }
              >
                <title>{s.name}</title>
              </polyline>
              {s.values.map((v, i) => (
                <g key={i}>
                  <title>{`${d.labels[i]}, ${s.name}: ${format(v)}`}</title>
                  {(patterns || s.values.length === 1) && (
                    <Marker index={patterns ? si : 0} x={x(i)} y={y(v)} />
                  )}
                </g>
              ))}
            </>
          ) : (
            s.values.map((v, i) => {
              const bw = (category * 0.72) / d.series.length;
              return (
                <rect
                  key={i}
                  x={left + category * i + category * 0.14 + bw * si}
                  y={Math.min(y(v), y(0))}
                  width={Math.max(0, bw - 2)}
                  height={Math.abs(y(v) - y(0))}
                  fill="currentColor"
                >
                  <title>{`${d.labels[i]}, ${s.name}: ${format(v)}`}</title>
                </rect>
              );
            })
          )}
        </g>
      ))}
      {d.labels.map(
        (label, i) =>
          i % stride === 0 && (
            <text
              key={i}
              className="chartmd__label"
              x={x(i)}
              y={bottom + 23}
              textAnchor="middle"
            >
              {shorten(label, 12)}
              <title>{label}</title>
            </text>
          ),
      )}
      {d.x && (
        <text
          className="chartmd__label"
          x={left + plotWidth / 2}
          y={bottom + 46}
          textAnchor="middle"
        >
          {d.x}
        </text>
      )}
      {d.y && (
        <text
          className="chartmd__label"
          transform={`translate(16 ${(top + bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {d.y}
        </text>
      )}
      {d.series.length > 1 &&
        d.series.map((s, si) => (
          <g
            key={si}
            transform={`translate(${left + ((si % 3) * plotWidth) / 3} ${legendTop + Math.floor(si / 3) * 26})`}
          >
            <g style={{ color: seriesColor(si) }}>
              {d.type === 'line' ? (
                <>
                  <line
                    className="chartmd__line"
                    x1="0"
                    x2="28"
                    strokeDasharray={
                      patterns ? lineStyles[si % 6]!.dash : undefined
                    }
                  />
                  {patterns && <Marker index={si} x={14} y={0} />}
                </>
              ) : (
                <rect x="0" y="-4" width="24" height="8" fill="currentColor" />
              )}
            </g>
            <text className="chartmd__label" x="38" y="4">
              {shorten(s.name, 18)}
              <title>{s.name}</title>
            </text>
          </g>
        ))}
    </svg>
  );
}
interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  node?: unknown;
  'data-chart'?: string;
}
function ChartContainer({
  node,
  'data-chart': serialized,
  children,
  ...props
}: ChartContainerProps) {
  void node;
  return serialized ? (
    <Chart data-chart={serialized} />
  ) : (
    <div {...props}>{children}</div>
  );
}
export const chartComponents = { div: ChartContainer };
