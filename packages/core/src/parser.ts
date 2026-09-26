import { ChartError, validate, type ChartDefinition } from './model.js';

/** Parse a chart body or a Markdown document containing exactly one chart fence. */
export function parse(source: string): ChartDefinition {
  const lines = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const blocks: { text: string; line: number }[][] = [];
  let fence:
    | { marker: string; length: number; chart: boolean; line: number }
    | undefined;
  let body: { text: string; line: number }[] = [];
  for (const [index, text] of lines.entries()) {
    if (fence) {
      const closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(text);
      if (
        closing &&
        closing[1]![0] === fence.marker &&
        closing[1]!.length >= fence.length
      ) {
        if (fence.chart) blocks.push(body);
        fence = undefined;
      } else if (fence.chart) body.push({ text, line: index + 1 });
      continue;
    }
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text);
    if (opening) {
      const info = opening[2]!.trim();
      if (/^chart\s/.test(info))
        throw new ChartError(
          `Line ${index + 1}: chart fence options are not supported yet.`,
        );
      fence = {
        marker: opening[1]![0]!,
        length: opening[1]!.length,
        chart: info === 'chart',
        line: index + 1,
      };
      body = [];
    }
  }
  if (fence?.chart)
    throw new ChartError(`Line ${fence.line}: unclosed chart fence.`);
  if (blocks.length > 1)
    throw new ChartError(
      'Expected one chart; multiple chart blocks are not supported by render.',
    );
  const input =
    blocks[0] ?? lines.map((text, index) => ({ text, line: index + 1 }));
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
