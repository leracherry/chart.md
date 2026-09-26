import { describe, expect, it } from 'vitest';
import {
  parse,
  render,
  validate,
  createScale,
  formatNumber,
  type ChartDefinition,
  type ChartType,
} from '../packages/core/src/index.js';

const multi = `type: line
title: API latency
unit: ms
x: Version
y: Latency

| Version | p50 | p95 | p99 |
| --- | ---: | ---: | ---: |
| v1 | 31 | 62 | 91 |
| v2 | 43 | 89 | 137 |
| v3 | 68 | 142 | 219 |`;

describe('series and axis parsing', () => {
  it('infers one series per numeric column, with explicit axis captions', () => {
    const chart = parse(multi);
    expect(chart.type).toBe('line');
    expect(chart.x).toBe('Version');
    expect(chart.y).toBe('Latency');
    expect(chart.series).toEqual([
      { name: 'p50', values: [31, 43, 68] },
      { name: 'p95', values: [62, 89, 142] },
      { name: 'p99', values: [91, 137, 219] },
    ]);
  });
  it('infers captions for the physical axes of horizontal bars', () => {
    const chart = parse(
      'type: horizontal-bar\n| Package | KB |\n| --- | --- |\n| Core | 18 |',
    );
    expect(chart.x).toBe('KB');
    expect(chart.y).toBe('Package');
  });
  it('keeps numeric-looking categories in source order', () => {
    const chart = parse(
      multi.replace('v1', '10').replace('v2', '1').replace('v3', '100'),
    );
    expect(chart.labels).toEqual(['10', '1', '100']);
  });
  it.each([
    [multi.replace('p99', 'p95'), 'unique'],
    [
      multi.replace('| v2 | 43 | 89 | 137 |', '| v2 | 43 | 89 |'),
      'columns to match',
    ],
    [multi.replace('137', 'bad'), 'numeric value in "p99"'],
    [
      multi.replace('| --- | ---: | ---: | ---: |', '| --- | ---: |'),
      'separator',
    ],
    [multi.replace('unit: ms', 'x: Extra'), 'Duplicate x'],
  ])('rejects invalid multi-series input %#', (source, message) => {
    expect(() => parse(source)).toThrow(message);
  });
  it('validates series counts, matching lengths, duplicate names, and metadata', () => {
    const chart = parse(multi);
    expect(() => validate({ ...chart, series: [] })).toThrow('1 and 6');
    expect(() =>
      validate({
        ...chart,
        series: Array.from({ length: 7 }, (_, i) => ({
          name: String(i),
          values: [1, 2, 3],
        })),
      }),
    ).toThrow('1 and 6');
    expect(() =>
      validate({ ...chart, series: [{ name: 'a', values: [1] }] }),
    ).toThrow('each label');
    expect(() =>
      validate({ ...chart, series: [chart.series[0]!, chart.series[0]!] }),
    ).toThrow('Duplicate series');
    expect(() =>
      validate({ ...chart, x: 3 } as unknown as ChartDefinition),
    ).toThrow('x must be text');
  });
});

describe('numeric scales', () => {
  it('uses readable ticks and expands to include every value', () => {
    const scale = createScale([18, 31], 300, 0);
    expect(scale.domain).toEqual([0, 40]);
    expect(scale.ticks).toEqual([0, 10, 20, 30, 40]);
    expect(scale.position(0)).toBe(300);
    expect(scale.position(20)).toBe(150);
    expect(scale.position(40)).toBe(0);
  });
  it.each([
    [0],
    [-5, -1],
    [-0.002, 0.003],
    [1e-9, 2e-9],
    [-1e12, 1e12],
    [-1e-9, 1e12],
  ])('produces finite, ordered zero-inclusive ticks for %j', (...values) => {
    const scale = createScale(values, 0, 100);
    expect(scale.domain[0]).toBeLessThanOrEqual(Math.min(...values));
    expect(scale.domain[1]).toBeGreaterThanOrEqual(Math.max(...values));
    expect(scale.ticks).toContain(0);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(2);
    expect(scale.ticks.length).toBeLessThanOrEqual(8);
    expect(new Set(scale.ticks.map(formatNumber)).size).toBe(
      scale.ticks.length,
    );
    scale.ticks.forEach((tick, i) => {
      expect(Number.isFinite(scale.position(tick))).toBe(true);
      if (i) expect(tick).toBeGreaterThan(scale.ticks[i - 1]!);
    });
  });
  it.each([
    [0, '0'],
    [-0, '0'],
    [124000, '124k'],
    [1500000, '1.5M'],
    [-2500000000, '-2.5B'],
    [1e12, '1T'],
    [0.0000012, '1.2e-6'],
    [0.01234, '0.01234'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });
  it('rejects unrepresentable scales and nonfinite labels', () => {
    expect(() => createScale([Infinity], 0, 100)).toThrow();
    expect(() => createScale([], 0, 100)).toThrow();
    expect(() => createScale([1], NaN, 100)).toThrow();
    expect(() => formatNumber(NaN)).toThrow();
  });
});

describe('chart engine SVG', () => {
  it.each(['bar', 'horizontal-bar', 'line'] as const)(
    'renders deterministic multi-series %s with a legend',
    (type) => {
      const chart = parse(multi.replace('type: line', `type: ${type}`));
      if (type === 'horizontal-bar') {
        chart.x = 'Latency';
        chart.y = 'Version';
      }
      const svg = render(chart);
      expect(svg).toBe(render(chart));
      expect(svg).toMatchSnapshot();
      for (const name of ['p50', 'p95', 'p99', 'Latency (ms)', 'Version'])
        expect(svg).toContain(name);
      expect(svg).toContain('p99 — v3: 219 ms');
      expect(svg).not.toMatch(/NaN|Infinity/);
    },
  );
  it('uses the same y-coordinate for identical values across line series', () => {
    const chart = parse(multi);
    chart.series = [
      { name: 'A', values: [10, 20, 30] },
      { name: 'B', values: [10, 20, 30] },
    ];
    const paths = [
      ...render(chart).matchAll(
        /<path d="([^"]+)"[^>]+stroke-width="2" stroke-linejoin/g,
      ),
    ].map((match) => match[1]);
    expect(paths).toHaveLength(2);
    expect(paths[0]).toBe(paths[1]);
  });
  it('places negative and positive bars on opposite sides of zero', () => {
    const chart: ChartDefinition = {
      type: 'horizontal-bar',
      labels: ['Loss', 'Gain'],
      series: [{ name: 'Change', values: [-10, 20] }],
    };
    const svg = render(chart);
    const bars = [
      ...svg.matchAll(
        /<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="#0969da"><title>Change/g,
      ),
    ];
    expect(bars).toHaveLength(2);
    expect(Number(bars[0]![1]) + Number(bars[0]![2])).toBeCloseTo(
      Number(bars[1]![1]),
      2,
    );
  });
  it('shows a marker for a one-point line and handles zero-only data', () => {
    const chart: ChartDefinition = {
      type: 'line',
      labels: ['Now'],
      series: [{ name: 'Count', values: [0] }],
    };
    const svg = render(chart);
    expect(svg).toContain('<circle');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
  it('escapes axis captions, legend names, and point descriptions', () => {
    const chart = parse(multi);
    chart.x = '<script>&';
    chart.y = '<img>';
    chart.series[0]!.name = '"<foreignObject>';
    const svg = render(chart);
    expect(svg).not.toMatch(/<script>|<img>|<foreignObject>/);
    expect(svg).toContain('&lt;script&gt;&amp;');
    expect(svg).toContain('&quot;&lt;foreignObject&gt;');
  });
  it.each(['bar', 'horizontal-bar', 'line'] as ChartType[])(
    'keeps geometry finite at maximum dataset size for %s',
    (type) => {
      const chart: ChartDefinition = {
        type,
        title: 'Long title '.repeat(30),
        labels: Array.from({ length: 40 }, (_, i) => `Category ${i}`),
        series: Array.from({ length: 6 }, (_, i) => ({
          name: `Series ${i}`,
          values: Array.from({ length: 40 }, (_, j) => (j - 20) * (i + 1)),
        })),
      };
      const svg = render(chart);
      expect(svg).not.toMatch(/NaN|Infinity/);
      expect(svg).toContain('Series 5');
      for (const match of svg.matchAll(/(?:width|height)="([\d.-]+)"/g))
        expect(Number(match[1])).toBeGreaterThanOrEqual(0);
    },
  );
});
