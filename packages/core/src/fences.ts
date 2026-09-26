import { ChartError } from './model.js';

export interface SourceLine {
  text: string;
  line: number;
}

export interface ChartBlock {
  body: SourceLine[];
  line: number;
  id?: string;
}

export function sourceLines(source: string): SourceLine[] {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((text, index) => ({ text, line: index + 1 }));
}

/** Find top-level fences, skipping fenced examples and HTML comments. */
export function findChartBlocks(lines: SourceLine[]): ChartBlock[] {
  const blocks: ChartBlock[] = [];
  let fence: { marker: string; length: number; block?: ChartBlock } | undefined;
  let comment = false;
  for (const row of lines) {
    const { text, line } = row;
    if (fence) {
      const closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(text);
      if (
        closing &&
        closing[1]![0] === fence.marker &&
        closing[1]!.length >= fence.length
      ) {
        if (fence.block) blocks.push(fence.block);
        fence = undefined;
      } else fence.block?.body.push(row);
      continue;
    }
    if (comment) {
      if (text.includes('-->')) comment = false;
      continue;
    }
    if (/^ {0,3}<!--/.test(text)) {
      comment = !text.includes('-->');
      continue;
    }
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text);
    if (!opening) continue;
    const info = opening[2]!.trim();
    // Backticks are not valid in a backtick fence's info string.
    if (opening[1]![0] === '`' && info.includes('`')) continue;
    fence = { marker: opening[1]![0]!, length: opening[1]!.length };
    if (!/^chart(?:\s|$)/.test(info)) continue;
    const match = /^chart(?:\s+id="([^"]*)")?$/.exec(info);
    if (!match)
      throw new ChartError(
        `Line ${line}: expected chart or chart id="my-chart".`,
      );
    fence.block = { body: [], line };
    if (match[1] !== undefined) fence.block.id = match[1];
  }
  if (fence?.block)
    throw new ChartError(`Line ${fence.block.line}: unclosed chart fence.`);
  return blocks;
}
