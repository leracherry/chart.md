# chartmd

## 0.1.0

### Minor Changes

- 0fe74db: Add line and horizontal bar charts, up to six series per chart, grouped bars,
  legends, physical-axis captions, shared numeric scales, readable ticks, and compact
  number formatting. Line charts use categories in source order with distinct markers
  and dash patterns. Include working examples for all chart types and signed values.

  The pre-release core API now represents `ChartDefinition.series` as an array,
  including single-series definitions. Wrap existing series objects in an array.
  Existing Markdown sources remain supported; generated SVG layout changes.

- f0b5a0b: Add the first Markdown-to-SVG bar chart workflow. Core exposes typed chart definitions,
  strict single-series table parsing, validation, and deterministic SVG rendering.
  The CLI renders one input file with `chartmd render`, supports explicit output paths,
  and reports invalid input without overwriting existing files.
- 4324637: Compile multiple chart fences in Markdown with `parseDocument` and `chartmd build`.
  Support explicit chart IDs, title-derived filenames, source-line diagnostics, and
  custom output directories. Rebuild generated SVGs deterministically while preserving
  unrelated files and unchanged outputs.

### Patch Changes

- Updated dependencies [0fe74db]
- Updated dependencies [f0b5a0b]
- Updated dependencies [4324637]
  - @chartmd/core@0.1.0
