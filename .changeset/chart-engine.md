---
'@chartmd/core': minor
'chartmd': minor
---

Add line and horizontal bar charts, up to six series per chart, grouped bars,
legends, physical-axis captions, shared numeric scales, readable ticks, and compact
number formatting. Line charts use categories in source order with distinct markers
and dash patterns. Include working examples for all chart types and signed values.

The pre-release core API now represents `ChartDefinition.series` as an array,
including single-series definitions. Wrap existing series objects in an array.
Existing Markdown sources remain supported; generated SVG layout changes.
