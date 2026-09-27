import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type SVGProps,
} from 'react';
import type { ChartDefinition } from './types.js';

const width = 720;
const height = 420;
const margin = { top: 54, right: 24, bottom: 76, left: 72 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const dashPatterns = ['', '8 5', '2 4', '10 4 2 4', '1 4'];

export interface ChartProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  definition?: ChartDefinition;
  'data-chart'?: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
  }).format(value);
}

function getDomain(definition: ChartDefinition): [number, number] {
  const values = definition.series.flatMap((series) => series.values);
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);
  if (minimum === maximum) maximum = minimum + 1;
  const padding = (maximum - minimum) * 0.08;
  if (minimum < 0) minimum -= padding;
  if (maximum > 0) maximum += padding;
  return [minimum, maximum];
}

function seriesOpacity(index: number): number {
  return Math.max(0.38, 0.94 - index * 0.14);
}

export function Chart({
  definition: suppliedDefinition,
  'data-chart': serializedDefinition,
  className,
  style,
  ...svgProps
}: ChartProps) {
  const definition =
    suppliedDefinition ?? parseSerialized(serializedDefinition);
  const titleId = `chartmd-title-${useId().replaceAll(':', '')}`;
  const descriptionId = `${titleId}-description`;
  const [minimum, maximum] = getDomain(definition);
  const y = (value: number) => {
    return margin.top + ((maximum - value) / (maximum - minimum)) * plotHeight;
  };
  const zeroY = y(0);
  const categoryWidth = plotWidth / definition.labels.length;
  const title =
    definition.title ?? `${definition.type === 'bar' ? 'Bar' : 'Line'} chart`;
  const description = definition.series
    .map((series) => {
      const values = definition.labels.map(
        (label, index) =>
          `${label}: ${formatNumber(series.values[index] ?? 0)}`,
      );
      return `${series.name}. ${values.join(', ')}`;
    })
    .join('. ');
  const mergedStyle = {
    color: 'var(--chartmd-color, currentColor)',
    ...style,
  } as CSSProperties;

  return (
    <svg
      {...svgProps}
      className={['chartmd', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>{description}</desc>

      {definition.title && (
        <text className="chartmd__title" x={margin.left} y={25} fontSize={20}>
          {definition.title}
        </text>
      )}

      {Array.from({ length: 5 }, (_, index) => {
        const value = minimum + ((maximum - minimum) * index) / 4;
        const gridY = y(value);
        return (
          <g key={index}>
            <line
              className="chartmd__grid"
              x1={margin.left}
              x2={width - margin.right}
              y1={gridY}
              y2={gridY}
              stroke="currentColor"
            />
            <text
              className="chartmd__label"
              x={margin.left - 10}
              y={gridY + 4}
              textAnchor="end"
              fontSize={12}
            >
              {formatNumber(value)}
            </text>
          </g>
        );
      })}

      <line
        className="chartmd__axis"
        x1={margin.left}
        x2={width - margin.right}
        y1={zeroY}
        y2={zeroY}
        stroke="currentColor"
      />

      {definition.type === 'bar'
        ? definition.labels.flatMap((label, labelIndex) => {
            const groupWidth = categoryWidth * 0.72;
            const barWidth = groupWidth / definition.series.length;
            const groupX =
              margin.left + labelIndex * categoryWidth + categoryWidth * 0.14;
            return definition.series.map((series, seriesIndex) => {
              const value = series.values[labelIndex] ?? 0;
              const valueY = y(value);
              return (
                <rect
                  key={`${label}-${series.name}`}
                  x={groupX + seriesIndex * barWidth + 1}
                  y={Math.min(zeroY, valueY)}
                  width={Math.max(1, barWidth - 2)}
                  height={Math.max(1, Math.abs(zeroY - valueY))}
                  fill="currentColor"
                  opacity={seriesOpacity(seriesIndex)}
                  rx={2}
                >
                  <title>{`${label}, ${series.name}: ${formatNumber(value)}`}</title>
                </rect>
              );
            });
          })
        : definition.series.map((series, seriesIndex) => {
            const points = series.values
              .map((value, index) => {
                const x = margin.left + categoryWidth * (index + 0.5);
                return `${x},${y(value)}`;
              })
              .join(' ');
            return (
              <g key={series.name} opacity={seriesOpacity(seriesIndex)}>
                <polyline
                  points={points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={
                    dashPatterns[seriesIndex % dashPatterns.length]
                  }
                />
                {series.values.map((value, index) => {
                  const label = definition.labels[index] ?? '';
                  return (
                    <circle
                      key={label}
                      cx={margin.left + categoryWidth * (index + 0.5)}
                      cy={y(value)}
                      r={4}
                      fill="currentColor"
                    >
                      <title>{`${label}, ${series.name}: ${formatNumber(value)}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

      {definition.labels.map((label, index) => (
        <text
          key={label}
          className="chartmd__label"
          x={margin.left + categoryWidth * (index + 0.5)}
          y={height - margin.bottom + 22}
          textAnchor="middle"
          fontSize={12}
        >
          {label.length > 14 ? `${label.slice(0, 13)}…` : label}
          <title>{label}</title>
        </text>
      ))}

      {definition.x && (
        <text
          className="chartmd__label"
          x={margin.left + plotWidth / 2}
          y={height - 12}
          textAnchor="middle"
          fontSize={13}
        >
          {definition.x}
        </text>
      )}
      {definition.y && (
        <text
          className="chartmd__label"
          transform={`translate(16 ${margin.top + plotHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={13}
        >
          {definition.y}
        </text>
      )}

      {definition.series.length > 1 &&
        definition.series.map((series, index) => (
          <g
            key={series.name}
            transform={`translate(${margin.left + index * 130} ${height - 34})`}
            opacity={seriesOpacity(index)}
          >
            {definition.type === 'bar' ? (
              <rect width={16} height={10} y={-9} rx={2} fill="currentColor" />
            ) : (
              <line
                x1={0}
                x2={18}
                y1={-4}
                y2={-4}
                stroke="currentColor"
                strokeWidth={3}
                strokeDasharray={dashPatterns[index % dashPatterns.length]}
              />
            )}
            <text className="chartmd__legend" x={24} fontSize={12}>
              {series.name}
            </text>
          </g>
        ))}
    </svg>
  );
}

function parseSerialized(value: string | undefined): ChartDefinition {
  if (!value) throw new Error('Chart requires a definition');
  const parsed: unknown = JSON.parse(value);
  if (!isChartDefinition(parsed)) {
    throw new Error('Chart received an invalid definition');
  }
  return parsed;
}

function isChartDefinition(value: unknown): value is ChartDefinition {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChartDefinition>;
  return (
    (candidate.type === 'bar' || candidate.type === 'line') &&
    Array.isArray(candidate.labels) &&
    candidate.labels.every((label) => typeof label === 'string') &&
    Array.isArray(candidate.series) &&
    candidate.series.length > 0 &&
    candidate.series.every((series) => {
      return (
        typeof series?.name === 'string' &&
        Array.isArray(series.values) &&
        series.values.length === candidate.labels?.length &&
        series.values.every(Number.isFinite)
      );
    })
  );
}

interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  node?: unknown;
  'data-chart'?: string;
}

function ChartContainer({
  node,
  'data-chart': serializedDefinition,
  children,
  ...props
}: ChartContainerProps) {
  void node;
  if (serializedDefinition) {
    return <Chart data-chart={serializedDefinition} />;
  }
  return <div {...props}>{children}</div>;
}

export const chartComponents = {
  div: ChartContainer,
};
