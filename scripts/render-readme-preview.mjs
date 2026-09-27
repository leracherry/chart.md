import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chart } from '../dist/index.js';

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

const chart = renderToStaticMarkup(
  createElement(Chart, {
    definition,
    style: {
      background: '#ffffff',
      color: '#24292f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  }),
);
const css = await readFile(resolve('style.css'), 'utf8');
const svg = chart.replace('>', `><style>${css}</style>`);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${svg}\n`);
