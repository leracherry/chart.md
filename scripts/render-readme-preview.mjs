import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chart, lineStyles } from '../dist/index.js';

const output = resolve(process.argv[2] ?? 'docs/chart-preview.svg');
const definition = {
  type: 'line',
  title: 'Response time',
  x: 'Release',
  y: 'Milliseconds',
  labels: ['1.0', '1.1', '1.2', '1.3', '1.4'],
  series: [
    { name: 'API', values: [182, 151, 127, 118, 96] },
    { name: 'Worker', values: [240, 205, 176, 149, 123] },
  ],
};
const variant = process.argv[3] ?? 'horizontal';
if (variant === 'paper' || variant === 'none') definition.grid = variant;
if (variant === 'styles') {
  definition.title = 'Automatic series colours';
  definition.y = 'Value';
  definition.series = lineStyles.map((_, i) => ({
    name: ['API', 'Worker', 'Cache', 'Search', 'Storage', 'Queue'][i],
    values: [30, 38, 34, 42, 39].map((v) => v + i * 35),
  }));
}

const darkPalette = [
  '#b29ad6',
  '#79add5',
  '#6bb6aa',
  '#ceaa75',
  '#d68faa',
  '#a9bc7a',
];
const chart = renderToStaticMarkup(
  createElement(Chart, {
    definition,
    style: {
      background: variant === 'dark' ? '#161b22' : '#ffffff',
      color: variant === 'dark' ? '#e6edf3' : '#24292f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  }),
).replace(/var\(--chartmd-series-(\d+),\s*([^)]*)\)/g, (_, index, fallback) =>
  variant === 'dark' ? darkPalette[Number(index) - 1] : fallback,
);
// Resolve default custom properties for librsvg, which does not implement CSS variables.
// Browser consumers use the original stylesheet and can override every variable.
const css = (await readFile(resolve('style.css'), 'utf8')).replace(
  /var\(--[\w-]+,\s*([^)]*)\)/g,
  '$1',
);
const svg = chart.replace('>', `><style>${css}</style>`);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${svg}\n`);
