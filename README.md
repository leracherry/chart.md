# chart.md

**Charts for README.md.** Charts belong in Markdown too.

A TypeScript tool for generating static SVG charts from Markdown tables.

## Status

Milestone 0 (repository foundation) is complete. The workspace builds, tests,
and lints. Parsing and chart rendering are planned for Milestone 1.
The packages are private while the initial API is being developed.

## Development

Use Node.js 22.13+ or 24+ and pnpm 10.17.1 (pinned in `package.json`).
If pnpm is not installed, run `npm install --global pnpm@10.17.1`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

`pnpm test` builds both packages before running package-resolution and CLI smoke
checks. `pnpm test:watch` builds once and starts Vitest in watch mode; rebuild
with `pnpm build` after changing package source files.
Use `pnpm format` to apply formatting.

Try the CLI scaffold after building:

```sh
node packages/cli/dist/index.js --help
```

## Workspace

- `packages/core` — `@chartmd/core`, reserved for the parser, chart model, and SVG renderer.
- `packages/cli` — `chartmd`, the command-line entry point.
- `tests` — smoke checks against the built packages.

Both packages emit ESM JavaScript, type declarations, and source maps into their
own `dist` directories. Generated files are excluded from Git.

## Next milestone

Implement one complete path from a single-series Markdown bar chart to an SVG:
chart model and validation, Markdown table parsing, SVG rendering, and
`chartmd render example.md`. Later milestones add README compilation, more chart
types, configuration, and external data sources.

## Changes

Run `pnpm changeset` for a user-facing change and commit the generated Markdown
file with the implementation. See [.changeset/README.md](.changeset/README.md).
Infrastructure-only changes do not require a release note.

CI validates pushes and pull requests on Node.js 22 and 24. Publishing is not
configured yet.
