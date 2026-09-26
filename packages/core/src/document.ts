import { ChartError, type ChartDefinition } from './model.js';
import { findChartBlocks, sourceLines } from './fences.js';
import { parseBody } from './parser.js';

export interface DocumentChart {
  id: string;
  /** One-based line of the opening chart fence. */
  line: number;
  chart: ChartDefinition;
}

const reserved = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$/;

/** ASCII filenames remain portable across filesystems and Markdown renderers. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}

export function parseDocument(source: string): DocumentChart[] {
  const blocks = findChartBlocks(sourceLines(source));
  const seen = new Map<string, number>();
  return blocks.map((block, index) => {
    let chart: ChartDefinition;
    try {
      chart = parseBody(block.body);
    } catch (error) {
      if (error instanceof ChartError && !/^Line \d+:/.test(error.message))
        throw new ChartError(`Line ${block.line}: ${error.message}`);
      throw error;
    }
    const derived = slugify(chart.title ?? '');
    const id =
      block.id ??
      (derived && !reserved.test(derived) ? derived : `chart-${index + 1}`);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
      id.length > 80 ||
      reserved.test(id)
    )
      throw new ChartError(
        `Line ${block.line}: invalid chart ID "${id}". Use 1–80 lowercase letters, digits, and single hyphens; reserved device names are not allowed.`,
      );
    const previous = seen.get(id);
    if (previous !== undefined)
      throw new ChartError(
        `Line ${block.line}: duplicate chart ID "${id}" (first used on line ${previous}). Set a unique id="..." on each chart fence.`,
      );
    seen.set(id, block.line);
    return { id, line: block.line, chart };
  });
}
