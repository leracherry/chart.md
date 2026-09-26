import { ChartError, validate, type ChartDefinition } from './model.js';
import { findChartBlocks, sourceLines, type SourceLine } from './fences.js';

/** Parse a chart body or a Markdown document containing exactly one chart fence. */
export function parse(source: string): ChartDefinition {
  const lines = sourceLines(source);
  const blocks = findChartBlocks(lines);
  if (blocks.length > 1)
    throw new ChartError(
      'Expected one chart; multiple chart blocks are not supported by render.',
    );
  return parseBody(blocks[0]?.body ?? lines);
}

export function parseBody(input: SourceLine[]): ChartDefinition {
  const nonempty = input.filter(({ text }) => text.trim());
  const metadata = new Map<string, string>();
  let cursor = 0;
  const fail = (line: number, message: string): never => {
    throw new ChartError(`Line ${line}: ${message}`);
  };
  while (
    cursor < nonempty.length &&
    !nonempty[cursor]!.text.trim().startsWith('|')
  ) {
    const { text, line } = nonempty[cursor++]!;
    const match = /^\s*(type|title|unit):\s*(.*?)\s*$/.exec(text);
    if (!match)
      fail(
        line,
        'Expected type, title, or unit metadata followed by a pipe-delimited table.',
      );
    const key = match![1]!;
    if (metadata.has(key)) fail(line, `Duplicate ${key} metadata.`);
    if (!match![2]) fail(line, `${key} cannot be empty.`);
    metadata.set(key, match![2]!);
  }
  if (metadata.get('type') !== 'bar')
    throw new ChartError('Expected type: bar.');
  const table = nonempty.slice(cursor);
  if (table.length < 3)
    throw new ChartError(
      'Expected a two-column Markdown table with a header, separator, and at least one data row.',
    );
  const cells = (row: { text: string; line: number }): string[] => {
    const text = row.text.trim();
    if (!text.startsWith('|') || !text.endsWith('|'))
      fail(row.line, 'Table rows must start and end with |.');
    const result = text
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());
    if (result.length !== 2 || result.some((cell) => !cell))
      fail(row.line, 'Expected exactly two nonempty columns.');
    return result;
  };
  const header = cells(table[0]!);
  if (!cells(table[1]!).every((cell) => /^:?-{3,}:?$/.test(cell)))
    fail(table[1]!.line, 'Invalid table separator; use --- or ---:.');
  const labels: string[] = [];
  const values: number[] = [];
  for (const row of table.slice(2)) {
    const [label, value] = cells(row);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value!))
      fail(row.line, `Expected a numeric value, received "${value}".`);
    labels.push(label!);
    values.push(Number(value));
  }
  const chart: ChartDefinition = {
    type: 'bar',
    labels,
    series: { name: header[1]!, values },
  };
  if (metadata.has('title')) chart.title = metadata.get('title')!;
  if (metadata.has('unit')) chart.unit = metadata.get('unit')!;
  validate(chart);
  return chart;
}
