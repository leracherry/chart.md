import { describe, expect, it } from 'vitest';
import { ChartSyntaxError, parseChart } from '../src/index.js';

const source = `type: bar
title: Sign-ups
x: Month
y: People

| Month | Free | Pro |
| --- | ---: | ---: |
| Jan | 120 | 32 |
| Feb | 168 | 48 |`;

describe('parseChart', () => {
  it('parses metadata and multiple series', () => {
    expect(parseChart(source)).toEqual({
      type: 'bar',
      title: 'Sign-ups',
      x: 'Month',
      y: 'People',
      labels: ['Jan', 'Feb'],
      series: [
        { name: 'Free', values: [120, 168] },
        { name: 'Pro', values: [32, 48] },
      ],
    });
  });

  it('supports escaped pipes and signed values', () => {
    const chart = parseChart(`type: line

| Release | Change |
| --- | ---: |
| Core \\| CLI | -4.5 |
| Web | 0 |`);

    expect(chart.labels).toEqual(['Core | CLI', 'Web']);
    expect(chart.series[0]?.values).toEqual([-4.5, 0]);
  });

  it('reports the source line for malformed values', () => {
    expect(() =>
      parseChart(`type: bar
| Item | Value |
| --- | ---: |
| Broken | nope |`),
    ).toThrow(
      new ChartSyntaxError(
        'column 2 must be a finite number; received “nope”',
        4,
      ),
    );
  });
});
