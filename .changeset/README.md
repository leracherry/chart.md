# Releases

The packages `@chartmd/core` and `chartmd` are versioned with Changesets.
Use `pnpm changeset` for user-facing changes, and commit the generated note with
the implementation. Infrastructure-only changes do not need a note.

## Prepare a version

```sh
pnpm changeset version
pnpm install --lockfile-only
pnpm format
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm release:check
```

Review the package versions, changelogs, and release archives, then commit and push.
`release:check` builds, packs both packages, and installs those exact archives in
an isolated consumer project. It tests the CLI and core import before publication.
The `workspace:*` dependency becomes the exact core version when pnpm packs it.

The comparison branch is `codex/repository-foundation`; update `baseBranch` in
`config.json` if the repository default branch changes.

## Publish with GitHub Actions

Run the **Publish npm packages** workflow on the reviewed release commit:

```sh
gh workflow run publish.yml --ref codex/repository-foundation -f dry_run=true
# After the dry run passes:
gh workflow run publish.yml --ref codex/repository-foundation -f dry_run=false
```

The workflow checks authentication, runs validation, and uploads the tested
archives. With `dry_run=false`, it publishes core before the CLI and verifies
installation from the public registry. `NPM_TOKEN` is read only by the npm
authentication and publication steps. Its account must be able to publish both
`chartmd` and packages in the `@chartmd` scope.

Stable versions use npm's `latest` tag; prerelease versions use `next`. For preview
releases, use Changesets prerelease mode (`pnpm changeset pre enter next`) before
versioning. Exit prerelease mode with `pnpm changeset pre exit` and version again
when ready for a stable release.

A retry skips an already-published version only if its tarball checksum matches
the prepared archive. If the archive differs, increment the version rather than
trying to replace an immutable npm release. Publishing does not create a GitHub
release or Git tag automatically.

The initial release candidate is `0.1.0`; its license is pending the owner's choice.
`UNLICENSED` is the restrictive placeholder until that choice is applied.
