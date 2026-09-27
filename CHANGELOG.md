# Changelog

## 0.5.0

- Make an open-sided, table-style grid the default: horizontal value guides and
  vertical guides aligned to visible category labels, with no side borders.
- Use 1 px neutral grey rules matching GitHub-style Markdown table borders,
  with light/dark themes and custom grid colour, width, and opacity.
- Add explicit `grid: both`; retain `horizontal`, `paper`, and `none` options.
- Refresh the live demo, README previews, presentation tests, and roadmap.

## 0.4.0

- Assign muted purple, blue, teal, ochre, rose and olive automatically.
- Generate additional hues beyond the initial palette instead of cycling it.
- Match legend colours to plot lines and bars; keep labels and guides neutral.
- Support system and explicit light/dark themes, with per-series CSS overrides.
- Add an editable Markdown demo page rendered by the actual package.
- Refresh all README chart previews with the new palette.

## 0.3.0

- Plain 1 px lines with automatically assigned grey tones; no symbols by default.
- Lighter axes and guides, smaller headings, and inherited document typography.
- Legacy dash and marker presentation remains available through `patterns`.
- Refreshed previews and documentation based on GitHub-style Markdown tables.
- Publish to npm, GitHub Packages, and GitHub Releases from one workflow.

## 0.2.0

- Refined document styling: thin lines, small markers, inherited font and colour.
- Six dash/marker combinations with matching legends that wrap into rows.
- Transparent backgrounds with horizontal, paper, and no-grid modes.
- Nice numeric tick intervals, tabular digits, locale and number-format props.
- Exact source values retained in accessible descriptions.
- Input validation for direct component calls and less crowded category labels.
- Actual rendered previews for line styles, grid variants, and dark documents.
