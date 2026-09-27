# chart.md

Markdown-native charts for React. Write a chart as a fenced Markdown block and
render it with `react-markdown`; the chart inherits the text colour of the
surrounding document.

````md
```chart
type: bar
title: Sign-ups
x: Month
y: People

| Month | Free | Pro |
| --- | ---: | ---: |
| Jan | 120 | 32 |
| Feb | 168 | 48 |
| Mar | 210 | 67 |
```
````

## Install

```sh
npm install chartmd react-markdown
```

## Use with React Markdown

```tsx
import Markdown from 'react-markdown';
import { chartComponents, remarkChart } from 'chartmd';
import 'chartmd/style.css';

export function Article({ source }: { source: string }) {
  return (
    <Markdown remarkPlugins={[remarkChart]} components={chartComponents}>
      {source}
    </Markdown>
  );
}
```

That is the complete integration. `remarkChart` recognizes fenced `chart`
blocks, validates their contents, and turns them into a chart node.
`chartComponents` tells `react-markdown` how to render that node.

The SVG uses `currentColor`, so a chart automatically follows the Markdown
container in light mode, dark mode, links, embedded docs, and custom themes:

```css
.markdown-body {
  color: #24292f;
}

@media (prefers-color-scheme: dark) {
  .markdown-body {
    color: #f0f6fc;
  }
}
```

Multiple series remain one-colour: they are distinguished by opacity and line
dash patterns. Optional CSS variables provide finer control without requiring a
chart theme:

```css
.markdown-body {
  --chartmd-color: currentColor;
  --chartmd-grid-opacity: 0.14;
  --chartmd-muted-opacity: 0.68;
}
```

## Chart syntax

`type` is `bar` or `line`. `title`, `x`, and `y` are optional plain-text
properties. The first table column supplies labels; every remaining column is a
numeric series.

````md
```chart
type: line
title: Response time
x: Release
y: Milliseconds

| Release | API | Worker |
| --- | ---: | ---: |
| 1.0 | 182 | 240 |
| 1.1 | 151 | 205 |
| 1.2 | 127 | 176 |
```
````

Values may be positive, negative, or zero. Tables require a header, a Markdown
separator row, and at least one data row. Invalid charts fail during Markdown
processing with a useful error instead of silently rendering broken output.

## Direct component use

The parser and component are also public when the Markdown renderer is managed
elsewhere:

```tsx
import { Chart, parseChart } from 'chartmd';

const definition = parseChart(chartSource);
return <Chart definition={definition} />;
```

Public exports:

- `remarkChart` — Markdown AST plugin.
- `chartComponents` — component map for `react-markdown`.
- `Chart` — responsive, accessible React SVG component.
- `parseChart` — parser for the fenced block body.
- `ChartDefinition`, `ChartSeries`, and `ChartType` — TypeScript types.

The package has no browser charting dependency and does not use a canvas,
network request, generated image, or client-side effect.

## Development and delivery

The product direction and release milestones live in [ROADMAP.md](ROADMAP.md).

```sh
pnpm install
pnpm check
```

## License

[MIT](LICENSE)
