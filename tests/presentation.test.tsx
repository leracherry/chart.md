import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Chart, lineStyles, parseChart } from '../src/index.js';
import { seriesColor } from '../src/chart.js';
const definition = {
  type: 'line' as const,
  labels: ['A', 'B'],
  series: lineStyles.map((s, i) => ({
    name: s.name,
    values: [i * 40, i * 40 + 30],
  })),
};
describe('document presentation', () => {
  it('uses six distinct markers and wraps its legend into a second row', () => {
    const html = renderToStaticMarkup(
      <Chart definition={definition} patterns />,
    );
    for (const { shape } of lineStyles)
      expect(html).toContain(`data-marker="${shape}"`);
    expect(html).toContain('translate(72 374)');
    expect(html).not.toContain('NaN');
  });
  it('defaults to plain coloured lines without point symbols', () => {
    const html = renderToStaticMarkup(<Chart definition={definition} />);
    expect(html).not.toContain('data-marker');
    expect(html).not.toContain('stroke-dasharray');
    expect(html).toContain('--chartmd-series-1, #7856a6');
    expect(html).toContain('--chartmd-series-2, #3975ad');
    const colors = Array.from({ length: 20 }, (_, index) =>
      seriesColor(index).split(', ').slice(1).join(', '),
    );
    expect(new Set(colors).size).toBe(20);
  });
  it('supports grid modes through Markdown syntax', () => {
    for (const grid of ['both', 'horizontal', 'paper', 'none']) {
      const d = parseChart(
        `type: line\ngrid: ${grid}\n| X | Y |\n| --- | --- |\n| A | 1 |`,
      );
      const html = renderToStaticMarkup(<Chart definition={d} />);
      expect(html.includes('class="chartmd__paper"')).toBe(grid === 'paper');
      expect(html.includes('class="chartmd__grid"')).toBe(grid !== 'none');
      expect(html.includes('data-grid="vertical"')).toBe(grid === 'both');
    }
    expect(() =>
      parseChart(
        'type: line\ngrid: invalid\n| X | Y |\n| --- | --- |\n| A | 1 |',
      ),
    ).toThrow('grid must');
  });
  it('defaults to an open-sided grid aligned to category centres, for lines and bars', () => {
    for (const type of ['line', 'bar'] as const) {
      const html = renderToStaticMarkup(
        <Chart definition={{ ...definition, type }} />,
      );
      const verticals = [
        ...html.matchAll(/<line[^>]*data-grid="vertical"[^>]*>/g),
      ].map((m) => m[0]);
      expect(verticals).toHaveLength(2);
      expect(verticals[0]).toContain('x1="228" x2="228"');
      expect(verticals[1]).toContain('x1="540" x2="540"');
      expect(html).not.toContain('chartmd__axis');
      expect(html).not.toMatch(/<line[^>]*x1="72" x2="72"/);
      expect(html).not.toMatch(/<line[^>]*x1="696" x2="696"/);
    }
  });
  it('keeps exact values accessible and supports percentage formatting', () => {
    const html = renderToStaticMarkup(
      <Chart
        definition={{
          ...definition,
          series: [{ name: 'Rate', values: [0.12345, 0.25] }],
        }}
        numberFormat={{ style: 'percent' }}
      />,
    );
    expect(html).toContain('A: 0.12345');
    expect(html).toContain('25%');
  });
  it('rejects malformed direct input and renders zero data without NaN', () => {
    expect(() =>
      renderToStaticMarkup(
        <Chart definition={{ ...definition, labels: [] }} />,
      ),
    ).toThrow();
    expect(
      renderToStaticMarkup(
        <Chart
          definition={{
            ...definition,
            series: [{ name: 'Zero', values: [0, 0] }],
          }}
        />,
      ),
    ).not.toContain('NaN');
  });
});
