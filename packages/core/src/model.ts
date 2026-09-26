export interface ChartDefinition {
  type: 'bar';
  title?: string;
  unit?: string;
  labels: string[];
  series: { name: string; values: number[] };
}

export class ChartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartError';
  }
}

export function validate(chart: ChartDefinition): void {
  if (chart.type !== 'bar')
    throw new ChartError('Only type: bar is supported.');
  if (chart.title !== undefined && typeof chart.title !== 'string')
    throw new ChartError('Title must be text.');
  if (chart.unit !== undefined && typeof chart.unit !== 'string')
    throw new ChartError('Unit must be text.');
  if (
    !Array.isArray(chart.labels) ||
    chart.labels.length < 1 ||
    chart.labels.length > 40
  )
    throw new ChartError('Provide between 1 and 40 data rows.');
  if (chart.labels.some((label) => typeof label !== 'string' || !label.trim()))
    throw new ChartError('Each row needs a nonempty label.');
  if (
    !chart.series ||
    typeof chart.series.name !== 'string' ||
    !chart.series.name.trim() ||
    !Array.isArray(chart.series.values) ||
    chart.series.values.length !== chart.labels.length
  )
    throw new ChartError(
      'Provide one named series with a value for each label.',
    );
  if (
    chart.series.values.some(
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
