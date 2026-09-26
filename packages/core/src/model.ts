export type ChartType = 'bar' | 'horizontal-bar' | 'line';

export interface SeriesDefinition {
  name: string;
  values: number[];
}

export interface ChartDefinition {
  type: ChartType;
  title?: string;
  unit?: string;
  /** Display captions for the physical horizontal and vertical axes. */
  x?: string;
  y?: string;
  /** Categories in source order, including for line charts. */
  labels: string[];
  series: SeriesDefinition[];
}

export class ChartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartError';
  }
}

export function validate(chart: ChartDefinition): void {
  if (!['bar', 'horizontal-bar', 'line'].includes(chart.type))
    throw new ChartError('Expected type: bar, horizontal-bar, or line.');
  for (const field of ['title', 'unit', 'x', 'y'] as const) {
    if (chart[field] !== undefined && typeof chart[field] !== 'string')
      throw new ChartError(`${field} must be text.`);
  }
  if (
    !Array.isArray(chart.labels) ||
    chart.labels.length < 1 ||
    chart.labels.length > 40
  )
    throw new ChartError('Provide between 1 and 40 data rows.');
  if (chart.labels.some((label) => typeof label !== 'string' || !label.trim()))
    throw new ChartError('Each row needs a nonempty label.');
  if (
    !Array.isArray(chart.series) ||
    chart.series.length < 1 ||
    chart.series.length > 6
  )
    throw new ChartError('Provide between 1 and 6 series.');
  const names = new Set<string>();
  for (const series of chart.series) {
    if (
      !series ||
      typeof series.name !== 'string' ||
      !series.name.trim() ||
      !Array.isArray(series.values) ||
      series.values.length !== chart.labels.length
    )
      throw new ChartError('Provide named series with a value for each label.');
    if (names.has(series.name))
      throw new ChartError(`Duplicate series name "${series.name}".`);
    names.add(series.name);
    if (
      series.values.some(
        (value) =>
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          Math.abs(value) > 1e12 ||
          (value !== 0 && Math.abs(value) < 1e-9),
      )
    )
      throw new ChartError(
        'Values must be finite numbers, zero or with magnitude between 1e-9 and 1e12.',
      );
  }
}
