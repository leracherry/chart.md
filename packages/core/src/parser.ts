import {
  ChartError,
  validate,
  type ChartType,
  type ChartDefinition,
} from './model.js';
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
    const match = /^\s*(type|title|unit|x|y):\s*(.*?)\s*$/.exec(text);
    if (!match)
      fail(
        line,
        'Expected type, title, unit, x, or y metadata followed by a pipe-delimited table.',
      );
    const key = match![1]!;
    if (metadata.has(key)) fail(line, `Duplicate ${key} metadata.`);
    if (!match![2]) fail(line, `${key} cannot be empty.`);
    metadata.set(key, match![2]!);
  }
  const type = metadata.get('type');
  if (!type || !['bar', 'horizontal-bar', 'line'].includes(type))
    throw new ChartError('Expected type: bar, horizontal-bar, or line.');
  const table = nonempty.slice(cursor);
  if (table.length < 3)
    throw new ChartError(
      'Expected a Markdown table with a header, separator, and at least one data row.',
    );
  const cells = (row: { text: string; line: number }): string[] => {
    const text = row.text.trim();
    if (!text.startsWith('|') || !text.endsWith('|'))
      fail(row.line, 'Table rows must start and end with |.');
    const result = text
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());
    if (result.length < 2 || result.length > 7 || result.some((cell) => !cell))
      fail(row.line, 'Expected 2–7 nonempty columns.');
    return result;
  };
  const header = cells(table[0]!);
  const separator = cells(table[1]!);
  if (
    separator.length !== header.length ||
    !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
  )
    fail(table[1]!.line, 'Invalid table separator; use --- or ---:.');
  const labels: string[] = [];
  const series = header
    .slice(1)
    .map((name) => ({ name, values: [] as number[] }));
  if (new Set(series.map(({ name }) => name)).size !== series.length)
    fail(table[0]!.line, 'Series column names must be unique.');
  for (const row of table.slice(2)) {
    const values = cells(row);
    if (values.length !== header.length)
      fail(row.line, `Expected ${header.length} columns to match the header.`);
    labels.push(values[0]!);
    for (const [index, value] of values.slice(1).entries()) {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
        fail(
          row.line,
          `Expected a numeric value in "${series[index]!.name}", received "${value}".`,
        );
      series[index]!.values.push(Number(value));
    }
  }
  const categoryCaption = header[0]!;
  const valueCaption = series.length === 1 ? series[0]!.name : 'Value';
  const chart: ChartDefinition = {
    type: type as ChartType,
    labels,
    series,
    x:
      metadata.get('x') ??
      (type === 'horizontal-bar' ? valueCaption : categoryCaption),
    y:
      metadata.get('y') ??
      (type === 'horizontal-bar' ? categoryCaption : valueCaption),
  };
  if (metadata.has('title')) chart.title = metadata.get('title')!;
  if (metadata.has('unit')) chart.unit = metadata.get('unit')!;
  validate(chart);
  return chart;
}
