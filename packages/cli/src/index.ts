#!/usr/bin/env node
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, render } from '@chartmd/core';

const help = `chartmd — Charts for README.md.

Usage: chartmd render <input.md> [--output <output.svg>]
       chartmd --help

Render one Markdown bar chart to a standalone SVG.
Output defaults to chart.svg in the current directory.`;

async function main(args: string[]): Promise<void> {
  if (
    !args.length ||
    (args.length === 1 && ['--help', '-h'].includes(args[0]!))
  ) {
    console.log(help);
    return;
  }
  if (args[0] !== 'render')
    throw new Error(
      'unsupported command. Run chartmd --help for available options.',
    );
  if (
    (args.length !== 2 && args.length !== 4) ||
    !args[1] ||
    args[1].startsWith('-') ||
    (args.length === 4 &&
      (args[2] !== '--output' || !args[3] || args[3].startsWith('-')))
  )
    throw new Error('Usage: chartmd render <input.md> [--output <output.svg>]');
  const input = resolve(args[1]);
  const output = resolve(args[3] ?? 'chart.svg');
  if (
    input === output ||
    (await realpath(input)) === (await realpath(output).catch(() => output))
  )
    throw new Error('Input and output must be different files.');
  const svg = render(parse(await readFile(input, 'utf8')));
  await writeFile(output, svg, { flag: 'wx' });
  console.log(`Rendered ${output}`);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`chartmd: ${message}`);
  process.exitCode = 1;
}
