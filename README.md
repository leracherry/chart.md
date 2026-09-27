# chart.md

Markdown-native charts for React. Write data as a Markdown table and render a
responsive chart that automatically matches the surrounding document.

![A line chart rendered by chart.md](https://raw.githubusercontent.com/leracherry/chart.md/main/docs/chart-preview.png)

## Install

```sh
npm install @leracherry/chartmd react-markdown
```

React is a peer dependency. No browser charting library is required.

## Quick start

Write a fenced `chart` block anywhere in your Markdown:

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

Add the plugin and component map to `react-markdown`:

```tsx
import Markdown from 'react-markdown';
import { chartComponents, remarkChart } from '@leracherry/chartmd';
import '@leracherry/chartmd/style.css';

export function Article({ source }: { source: string }) {
  return (
    <Markdown remarkPlugins={[remarkChart]} components={chartComponents}>
      {source}
    </Markdown>
  );
}
```

`remarkChart` parses and validates chart fences. `chartComponents` renders the
result as accessible, server-renderable SVG.

## Syntax

The first table column supplies the labels. Every remaining column becomes a
numeric series.

| Property | Required | Description                                |
| -------- | -------- | ------------------------------------------ |
| `type`   | Yes      | `bar` or `line`                            |
| `title`  | No       | Accessible chart title and visible heading |
| `x`      | No       | Horizontal-axis label                      |
| `y`      | No       | Vertical-axis label                        |

Values may be positive, negative, or zero. Table rows require the same number
of cells as the header, and series names must be unique. Invalid input fails
during Markdown processing instead of silently producing a broken chart.

Here is a bar chart with two series:

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

Both backtick and tilde Markdown fences are supported.

## Theme inheritance

Charts use `currentColor`, so they follow the text colour of their Markdown
container in light mode, dark mode, and custom themes. Multiple series remain
one-colour and are distinguished with opacity and dash patterns.

```css
.markdown-body {
  color: #24292f;
  --chartmd-color: currentColor;
  --chartmd-grid-opacity: 0.14;
  --chartmd-muted-opacity: 0.68;
}

@media (prefers-color-scheme: dark) {
  .markdown-body {
    color: #f0f6fc;
  }
}
```

The CSS variables are optional. Importing `@leracherry/chartmd/style.css` is
enough for the default presentation.

## Direct component use

The parser and React component are public when Markdown is handled elsewhere:

```tsx
import { Chart, parseChart } from '@leracherry/chartmd';
import '@leracherry/chartmd/style.css';

const definition = parseChart(chartSource);
return <Chart definition={definition} />;
```

## API

- `remarkChart` — Remark-compatible Markdown AST plugin.
- `chartComponents` — component map for `react-markdown`.
- `Chart` — responsive and accessible React SVG component.
- `parseChart` — parser for a chart fence body.
- `ChartDefinition`, `ChartSeries`, and `ChartType` — TypeScript types.

The renderer uses no canvas, network request, generated image, or client-side
effect. It works with server rendering and hydration.

## Development

The product direction and release milestones are documented in
[ROADMAP.md](ROADMAP.md).

```sh
pnpm install
pnpm check
```

Run `node scripts/render-readme-preview.mjs` after building to regenerate the
SVG source used for the README preview.

## License

[MIT](LICENSE)
