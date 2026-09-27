import {
  ChartSyntaxError,
  type ChartDefinition,
  type ChartType,
} from './types.js';

const metadataKeys = new Set(['type', 'title', 'x', 'y', 'grid']);
const separatorCell = /^:?-{3,}:?$/;

function splitRow(row: string, line: number): string[] {
  const trimmed = row.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    throw new ChartSyntaxError('table rows must start and end with “|”', line);
  }

  const cells: string[] = [];
  let cell = '';
  let escaped = false;

  for (const character of trimmed.slice(1, -1)) {
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }

  if (escaped) cell += '\\';
  cells.push(cell.trim());
  return cells;
}

function parseNumber(value: string, line: number, column: number): number {
  if (value === '') {
    throw new ChartSyntaxError(`column ${column} is missing a number`, line);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ChartSyntaxError(
      `column ${column} must be a finite number; received “${value}”`,
      line,
    );
  }
  return parsed;
}

export function parseChart(source: string): ChartDefinition {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const metadata: Record<string, string> = {};
  let tableStart = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    if (line === '') continue;
    if (line.startsWith('|')) {
      tableStart = index;
      break;
    }

    const match = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!match) {
      throw new ChartSyntaxError(
        'expected a property or Markdown table',
        index + 1,
      );
    }

    const key = match[1] ?? '';
    const value = match[2]?.trim() ?? '';
    if (!metadataKeys.has(key)) {
      throw new ChartSyntaxError(`unknown property “${key}”`, index + 1);
    }
    if (key in metadata) {
      throw new ChartSyntaxError(`duplicate property “${key}”`, index + 1);
    }
    if (value === '') {
      throw new ChartSyntaxError(
        `property “${key}” cannot be empty`,
        index + 1,
      );
    }
    metadata[key] = value;
  }

  if (metadata.type !== 'bar' && metadata.type !== 'line') {
    throw new ChartSyntaxError('type must be “bar” or “line”');
  }
  if (tableStart < 0) {
    throw new ChartSyntaxError('a Markdown table is required');
  }

  const nonEmptyRows = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .slice(tableStart)
    .filter(({ line }) => line.trim() !== '');

  if (nonEmptyRows.length < 3) {
    throw new ChartSyntaxError(
      'the table needs a header and at least one data row',
    );
  }

  const headerRow = nonEmptyRows[0];
  const separatorRow = nonEmptyRows[1];
  if (!headerRow || !separatorRow) {
    throw new ChartSyntaxError('the table is incomplete');
  }
  const headers = splitRow(headerRow.line, headerRow.number);
  const separators = splitRow(separatorRow.line, separatorRow.number);

  if (headers.length < 2 || headers.some((header) => header === '')) {
    throw new ChartSyntaxError(
      'the table needs a label column and at least one named series',
      headerRow.number,
    );
  }
  if (
    separators.length !== headers.length ||
    separators.some((cell) => !separatorCell.test(cell))
  ) {
    throw new ChartSyntaxError(
      'the separator row must match the header and use at least three dashes',
      separatorRow.number,
    );
  }

  const duplicate = headers.slice(1).find((name, index, names) => {
    return names.indexOf(name) !== index;
  });
  if (duplicate) {
    throw new ChartSyntaxError(
      `duplicate series name “${duplicate}”`,
      headerRow.number,
    );
  }

  const labels: string[] = [];
  const series = headers
    .slice(1)
    .map((name) => ({ name, values: [] as number[] }));

  for (const row of nonEmptyRows.slice(2)) {
    const cells = splitRow(row.line, row.number);
    if (cells.length !== headers.length) {
      throw new ChartSyntaxError(
        `expected ${headers.length} columns but found ${cells.length}`,
        row.number,
      );
    }
    const label = cells[0] ?? '';
    if (label === '') {
      throw new ChartSyntaxError('labels cannot be empty', row.number);
    }
    labels.push(label);
    for (let index = 1; index < cells.length; index += 1) {
      series[index - 1]?.values.push(
        parseNumber(cells[index] ?? '', row.number, index + 1),
      );
    }
  }

  const definition: ChartDefinition = {
    type: metadata.type as ChartType,
    labels,
    series,
  };
  if (metadata.title) definition.title = metadata.title;
  if (metadata.x) definition.x = metadata.x;
  if (metadata.y) definition.y = metadata.y;
  if (metadata.grid) {
    if (!['both', 'horizontal', 'paper', 'none'].includes(metadata.grid)) {
      throw new ChartSyntaxError(
        'grid must be “both”, “horizontal”, “paper”, or “none”',
      );
    }
    definition.grid = metadata.grid as NonNullable<ChartDefinition['grid']>;
  }
  return definition;
}
