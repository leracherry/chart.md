# @chartmd/core

Parse Markdown chart definitions and render deterministic standalone SVG in
TypeScript. No runtime dependencies. Requires Node.js 22.13+ or 24+.

```sh
npm install @chartmd/core
```

```ts
import { parse, render } from '@chartmd/core';

const chart = parse(`type: bar
unit: KB
| Package | Size |
| --- | ---: |
| Core | 18 |
| CLI | 31 |`);
const svg = render(chart);
```

Use `parseDocument(markdown)` to extract multiple fenced chart blocks. Each result
contains `id`, the opening fence's `line`, and a `chart` definition for `render`.

```ts
import { render, type ChartDefinition } from '@chartmd/core';

const chart: ChartDefinition = {
  type: 'line',
  title: 'Latency',
  unit: 'ms',
  x: 'Version',
  y: 'Latency',
  labels: ['v1', 'v2'],
  series: [
    { name: 'p50', values: [31, 24] },
    { name: 'p95', values: [62, 48] },
  ],
};
const svg = render(chart);
```

Supports `bar`, `horizontal-bar`, and `line`, with 1–40 categories and 1–6 series.
Line categories are equally spaced. Nonzero numeric magnitudes must be between
`1e-9` and `1e12`. `series` is always an array, including single-series charts.

For CLI usage, install `chartmd`. See the
[full documentation](https://github.com/leracherry/chart.md#readme) for grammar,
validation rules, generated output, and examples.
