# Product roadmap

## Product promise

Install one package, add one Remark plugin and one component map to a React
Markdown renderer, then write accessible charts in Markdown. Charts should feel
native to the document rather than like embedded third-party widgets.

## Milestone 1 — React Markdown foundation (implemented)

- Fenced `chart` syntax with Markdown tables.
- Bar and line charts with multiple numeric series.
- `react-markdown` integration through `remarkChart` and `chartComponents`.
- Responsive, server-renderable SVG output with accessible titles and data
  descriptions.
- One-colour rendering based on `currentColor`, with opacity and dash patterns
  for series differentiation.
- Published TypeScript declarations, focused tests, and npm package metadata.

Exit criteria: a consumer can install `@leracherry/chartmd` and
`react-markdown`, paste the README example, and render a chart without
configuration or another charting library.

## Milestone 2 — Markdown ecosystem coverage

- Compatibility fixtures for Unified/Remark pipelines beyond `react-markdown`.
- Horizontal bars and compact/sparkline presentation.
- Better diagnostics with source positions for malformed cells.
- Documented hooks for custom labels and numeric formatting.

Exit criteria: the same chart source works consistently in the major
Remark-based React rendering paths.

## Milestone 3 — Custom rendering without theme drift

- Component overrides for marks, labels, legends, and tooltips.
- Locale-aware number formatting.
- Explicit colour opt-in for teams that need multi-colour series, while keeping
  one-colour inheritance as the default.
- Visual regression suite for light, dark, narrow, and high-contrast layouts.

Exit criteria: applications can customize chart behavior deeply without
forking the parser or losing Markdown-theme inheritance.

## Release policy

Patch releases fix parsing, rendering, accessibility, or documentation.
Minor releases may add syntax and component options without changing existing
chart meaning. Breaking syntax or React integration changes require a major
release and a migration guide.
