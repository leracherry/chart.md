import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Chart, lineStyles, parseChart } from '../src/index.js';
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
    const html = renderToStaticMarkup(<Chart definition={definition} />);
    for (const { shape } of lineStyles)
      expect(html).toContain(`data-marker="${shape}"`);
    expect(html).toContain('translate(72 374)');
    expect(html).not.toContain('NaN');
  });
  it('supports grid modes through Markdown syntax', () => {
    for (const grid of ['horizontal', 'paper', 'none']) {
      const d = parseChart(
        `type: line\ngrid: ${grid}\n| X | Y |\n| --- | --- |\n| A | 1 |`,
      );
      const html = renderToStaticMarkup(<Chart definition={d} />);
      expect(html.includes('class="chartmd__paper"')).toBe(grid === 'paper');
      expect(html.includes('class="chartmd__grid"')).toBe(grid !== 'none');
    }
    expect(() =>
      parseChart(
        'type: line\ngrid: invalid\n| X | Y |\n| --- | --- |\n| A | 1 |',
      ),
    ).toThrow('grid must');
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
