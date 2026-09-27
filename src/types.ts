export type ChartType = 'bar' | 'line';

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartDefinition {
  type: ChartType;
  title?: string;
  x?: string;
  y?: string;
  grid?: 'both' | 'horizontal' | 'paper' | 'none';
  labels: string[];
  series: ChartSeries[];
}

export class ChartSyntaxError extends Error {
  override name = 'ChartSyntaxError';

  constructor(
    message: string,
    readonly line?: number,
  ) {
    super(line === undefined ? message : `Line ${line}: ${message}`);
  }
}
