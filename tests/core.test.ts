import { describe, expect, it } from 'vitest';
import { parse, render, numericDomain } from '../packages/core/src/index.js';

const body = `type: bar\ntitle: Bundle size\nunit: KB\n\n| Package | Size |\n| --- | ---: |\n| Core | 18 |\n| CLI | 31 |`;

describe('parse', () => {
  it('parses metadata and one series from a bare body', () => {
    expect(parse(body)).toEqual({
      type: 'bar',
      title: 'Bundle size',
      unit: 'KB',
      labels: ['Core', 'CLI'],
      series: { name: 'Size', values: [18, 31] },
    });
  });
  it('extracts one chart with source line numbers, accepting CRLF and tilde fences', () => {
    expect(
      parse(
        `Intro\r\n~~~chart\r\n${body.replaceAll('\n', '\r\n')}\r\n~~~\r\nAfter`,
      ),
    ).toEqual(parse(body));
    expect(() =>
      parse('Intro\n```chart\ntype: bar\nunknown: yes\n```'),
    ).toThrow('Line 4:');
  });
  it('ignores chart examples nested inside other fences', () => {
    expect(
      parse(
        `\`\`\`\`md\n\`\`\`chart\nnot a chart\n\`\`\`\n\`\`\`\`\n\`\`\`chart\n${body}\n\`\`\``,
      ),
    ).toEqual(parse(body));
  });
  it('accepts signed decimals, zero, and scientific notation', () => {
    expect(
      parse(
        body
          .replace('| Core | 18 |', '| Core | -1.5e2 |')
          .replace('| CLI | 31 |', '| CLI | 0 |'),
      ).series.values,
    ).toEqual([-150, 0]);
  });
  it.each([
    [body.replace('type: bar', 'type: line'), 'type: bar'],
    [body.replace('title:', 'source:'), 'Expected type, title, or unit'],
    [body.replace('type: bar', 'type: bar\ntype: bar'), 'Duplicate type'],
    [body.replace('18', '18KB'), 'numeric value'],
    [body.replace('18', 'NaN'), 'numeric value'],
    [body.replace('18', '1e309'), 'finite numbers'],
    [body.replace('18', '1e-12'), 'magnitude'],
    [
      body.replace('| Core | 18 |', '| Core | 18 | 22 |'),
      'two nonempty columns',
    ],
    [body.replace('| Core |', '| |'), 'two nonempty columns'],
    [body.replace('---:', '--:'), 'separator'],
    ['```chart\n' + body, 'unclosed'],
    [
      '```chart\n' + body + '\n```\n```chart\n' + body + '\n```',
      'multiple chart blocks',
    ],
    ['type: bar', 'two-column Markdown table'],
  ])('rejects invalid source %#', (source, error) => {
    expect(() => parse(source)).toThrow(error);
  });
});

describe('render', () => {
  it('renders a deterministic SVG fixture', () => {
    const svg = render(parse(body));
    expect(svg).toBe(render(parse(body)));
    expect(svg).toMatchSnapshot();
  });
  it('escapes user text in all SVG contexts', () => {
    const svg = render(
      parse(body.replace('Bundle size', '<script>&"').replace('Core', '<img>')),
    );
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<img>');
    expect(svg).toContain('&lt;script&gt;&amp;&quot;');
    expect(svg).toContain('&lt;img&gt;');
  });
  it.each([
    [0, 0],
    [-18, -31],
    [-18, 31],
    [0.000001, 1e12],
  ])(
    'handles zero, negative, mixed, and disparate magnitudes: %j',
    (...values) => {
      const chart = parse(body);
      chart.series.values = values;
      const svg = render(chart);
      expect(svg).not.toMatch(/NaN|Infinity/);
      for (const match of svg.matchAll(/height="([\d.-]+)"/g))
        expect(Number(match[1])).toBeGreaterThanOrEqual(0);
    },
  );
  it('validates programmatic definitions', () => {
    const chart = parse(body);
    chart.series.values = [Infinity];
    expect(() => render(chart)).toThrow('value for each label');
    chart.series.values = [Infinity, 1];
    expect(() => render(chart)).toThrow('finite numbers');
  });
  it('calculates zero-inclusive domains', () => {
    expect(numericDomain([2, 4])).toEqual([0, 4]);
    expect(numericDomain([-2, -4])).toEqual([-4, 0]);
    expect(numericDomain([-2, 4])).toEqual([-2, 4]);
    expect(numericDomain([0])).toEqual([0, 1]);
    expect(() => numericDomain([])).toThrow();
  });
});
