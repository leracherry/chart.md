# chartmd

**Charts for README.md.** Generate static SVG charts from Markdown tables.

Requires Node.js 22.13+ or 24+.

```sh
npm install --save-dev chartmd
npx chartmd build README.md
```

Write a chart in your README:

````md
```chart id="bundle-size"
type: bar
title: Bundle size
unit: KB

| Package | Size |
| --- | ---: |
| Core | 18 |
| CLI | 31 |
```

![Bundle size](./.github/charts/bundle-size.svg)
````

`build` generates `.github/charts/bundle-size.svg`. It supports multiple chart
blocks and updates its own generated SVGs without changing the Markdown file.

```sh
chartmd build README.md --output docs/charts
chartmd render example.md --output chart.svg
chartmd --help
```

Output paths are relative to the current directory. `render` accepts one chart
and refuses to overwrite an existing file. `build` only replaces files it generated.

Chart types: `bar`, `horizontal-bar`, and `line`. Each numeric table column
becomes a series, up to six. Optional `x` and `y` metadata set physical axis
captions. Line categories are equally spaced in source order.

See the [full documentation and examples](https://github.com/leracherry/chart.md#readme)
for syntax, limits, chart IDs, and the programmatic `@chartmd/core` API.
