#!/usr/bin/env node
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ChartError, parse, render } from '@chartmd/core';
import { build } from './build.js';

const help = `chartmd — Charts for README.md.

Usage: chartmd render <input.md> [--output <output.svg>]
       chartmd build <input.md> [--output <directory>]
       chartmd --help

Render one Markdown bar chart to a standalone SVG.
render defaults to chart.svg; build defaults to .github/charts.
Output paths are relative to the current directory.`;

async function main(args: string[]): Promise<void> {
  if (
    !args.length ||
    (args.length === 1 && ['--help', '-h'].includes(args[0]!))
  ) {
    console.log(help);
    return;
  }
  if (args[0] !== 'render' && args[0] !== 'build')
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
    throw new Error(
      `Usage: chartmd ${args[0]} <input.md> [--output <${args[0] === 'build' ? 'directory' : 'output.svg'}>]`,
    );
  const input = resolve(args[1]);
  const output = resolve(
    args[3] ?? (args[0] === 'build' ? '.github/charts' : 'chart.svg'),
  );
  const source = await readFile(input, 'utf8');
  try {
    if (args[0] === 'build') {
      await build(input, source, output);
      return;
    }
    if (
      input === output ||
      (await realpath(input)) === (await realpath(output).catch(() => output))
    )
      throw new Error('Input and output must be different files.');
    const svg = render(parse(source));
    await writeFile(output, svg, { flag: 'wx' });
    console.log(`Rendered ${output}`);
  } catch (error) {
    if (error instanceof ChartError)
      throw new Error(`${input}: ${error.message}`, { cause: error });
    throw error;
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`chartmd: ${message}`);
  process.exitCode = 1;
}
