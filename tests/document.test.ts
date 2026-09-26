import { describe, expect, it } from 'vitest';
import { parse, parseDocument, slugify } from '../packages/core/src/index.js';

const body =
  'type: bar\ntitle: Bundle size\n\n| Package | Size |\n| --- | ---: |\n| Core | 18 |';
const fence = (source = body, info = 'chart', marker = '```') =>
  `${marker}${info}\n${source}\n${marker}`;

describe('README chart extraction', () => {
  it('returns definitions, stable IDs, and opening source lines', () => {
    const charts = parseDocument(
      '# Demo\n\n' +
        fence() +
        '\n\n' +
        fence(body, 'chart id="runtime"', '~~~'),
    );
    expect(charts.map(({ id, line }) => ({ id, line }))).toEqual([
      { id: 'bundle-size', line: 3 },
      { id: 'runtime', line: 12 },
    ]);
    expect(charts[0]!.chart).toEqual(parse(body));
  });
  it('keeps title-derived IDs stable when charts are reordered or values change', () => {
    const second = fence(body.replace('Bundle size', 'Runtime'));
    expect(
      parseDocument(second + '\n' + fence(body.replace('18', '19'))).map(
        (chart) => chart.id,
      ),
    ).toEqual(['runtime', 'bundle-size']);
    expect(
      parseDocument(fence() + '\n' + second).map((chart) => chart.id),
    ).toEqual(['bundle-size', 'runtime']);
  });
  it('supports BOM, CRLF, whitespace, and longer closing fences', () => {
    expect(
      parseDocument('\uFEFF' + fence().replaceAll('\n', '\r\n') + '`')[0]!.id,
    ).toBe('bundle-size');
    expect(
      parseDocument(
        fence()
          .split('\n')
          .map((line) => '   ' + line)
          .join('\n'),
      )[0]!.id,
    ).toBe('bundle-size');
  });
  it('ignores examples, other languages, comments, and chart-like info strings', () => {
    const markdown =
      fence(fence(), 'md', '````') +
      '\n' +
      fence('bad', 'chartjs') +
      '\n<!--\n' +
      fence('bad') +
      '\n-->\n' +
      fence();
    expect(parseDocument(markdown)).toHaveLength(1);
    expect(parseDocument(fence('bad', 'text'))).toEqual([]);
    expect(parseDocument('# Plain README')).toEqual([]);
    expect(parseDocument(body)).toEqual([]);
    expect(parseDocument('    ```chart\n    bad\n    ```')).toEqual([]);
  });
  it('uses positional fallback IDs for untitled, non-ASCII-only, and reserved titles', () => {
    expect(
      parseDocument(fence(body.replace('title: Bundle size\n', '')))[0]!.id,
    ).toBe('chart-1');
    expect(
      parseDocument(fence(body.replace('Bundle size', '日本語')))[0]!.id,
    ).toBe('chart-1');
    expect(
      parseDocument(fence(body.replace('Bundle size', 'CON')))[0]!.id,
    ).toBe('chart-1');
  });
  it('honors explicit IDs even when titles are identical', () => {
    expect(
      parseDocument(
        fence(body, 'chart id="one"') + '\n' + fence(body, 'chart id="two"'),
      ).map((chart) => chart.id),
    ).toEqual(['one', 'two']);
  });
  it.each([
    '',
    '../outside',
    'A',
    'x/y',
    'x\\y',
    '-x',
    'x-',
    'x--y',
    'con',
    'lpt1',
    'a'.repeat(81),
  ])('rejects unsafe or nonportable ID %j', (id) => {
    expect(() => parseDocument(fence(body, `chart id="${id}"`))).toThrow(
      'invalid chart ID',
    );
  });
  it.each(['chart id=foo', 'chart id="x" theme="dark"', 'chart id="x" id="y"'])(
    'rejects unsupported fence syntax %j',
    (info) => {
      expect(() => parseDocument(fence(body, info))).toThrow(
        'Line 1: expected chart',
      );
    },
  );
  it('rejects collisions between explicit, derived, and fallback IDs', () => {
    expect(() => parseDocument(fence() + '\n' + fence())).toThrow(
      'duplicate chart ID "bundle-size"',
    );
    expect(() =>
      parseDocument(fence() + '\n' + fence(body, 'chart id="bundle-size"')),
    ).toThrow('first used on line 1');
    expect(() =>
      parseDocument(
        fence(body.replace('title: Bundle size\n', '')) +
          '\n' +
          fence(body, 'chart id="chart-1"'),
      ),
    ).toThrow('duplicate chart ID');
  });
  it('reports document-relative errors in later blocks', () => {
    expect(() =>
      parseDocument(
        fence() +
          '\n\n' +
          fence(body.replace('18', 'bad'), 'chart id="second"'),
      ),
    ).toThrow('Line 16:');
    expect(() => parseDocument('Intro\n\n```chart\ntype: area\n```')).toThrow(
      'Line 3: Expected type: bar',
    );
    expect(() => parseDocument('Intro\n\n```chart\n' + body)).toThrow(
      'Line 3: unclosed',
    );
  });
  it('does not treat shorter or mismatched fences as closing fences', () => {
    expect(() => parseDocument('````chart\n' + body + '\n```')).toThrow(
      'unclosed',
    );
    expect(() => parseDocument('```chart\n' + body + '\n~~~')).toThrow(
      'unclosed',
    );
  });
  it('retains the single-chart render API with an explicit fence ID', () => {
    expect(parse(fence(body, 'chart id="bundle"'))).toEqual(parse(body));
  });
});

describe('slugify', () => {
  it('normalizes titles deterministically to portable filenames', () => {
    expect(slugify('  Café / Bundle SIZE!  ')).toBe('cafe-bundle-size');
    expect(slugify('x'.repeat(90))).toHaveLength(80);
    expect(slugify('!!!')).toBe('');
  });
});
