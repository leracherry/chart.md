import { ChartError } from './model.js';

/** Zero-inclusive, non-degenerate domain shared by every series. */
export function numericDomain(values: readonly number[]): [number, number] {
  if (!values.length || values.some((value) => !Number.isFinite(value)))
    throw new ChartError('Domain requires finite numeric values.');
  const min = values.reduce((a, b) => Math.min(a, b), 0);
  const max = values.reduce((a, b) => Math.max(a, b), 0);
  return min === max ? [0, 1] : [min, max];
}

export interface NumericScale {
  domain: [number, number];
  ticks: number[];
  position(value: number): number;
}

/** Expand to multiples of a 1/2/5 step, with roughly five intervals. */
export function createScale(
  values: readonly number[],
  start: number,
  end: number,
): NumericScale {
  const [min, max] = numericDomain(values);
  const raw = (max - min) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const ratio = raw / magnitude;
  const step =
    (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;
  if (
    !Number.isFinite(step) ||
    step === 0 ||
    !Number.isFinite(start) ||
    !Number.isFinite(end)
  )
    throw new ChartError('Scale range is not representable.');
  const lower = Math.floor(min / step);
  const upper = Math.ceil(max / step);
  const clean = (value: number): number => Number(value.toPrecision(12));
  const domain: [number, number] = [clean(lower * step), clean(upper * step)];
  const ticks = Array.from({ length: upper - lower + 1 }, (_, i) =>
    clean((lower + i) * step),
  );
  return {
    domain,
    ticks,
    position: (value) =>
      start + ((value - domain[0]) / (domain[1] - domain[0])) * (end - start),
  };
}

/** Compact, locale-independent labels; precise values remain in SVG descriptions. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value))
    throw new ChartError('Cannot format a non-finite number.');
  if (value === 0) return '0';
  const abs = Math.abs(value);
  for (const [limit, suffix] of [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k'],
  ] as const) {
    if (abs >= limit)
      return `${Number((value / limit).toPrecision(4))}${suffix}`;
  }
  return abs < 0.001
    ? value.toExponential(2).replace(/\.?(0+)(?=e)/, '')
    : String(Number(value.toPrecision(4)));
}
