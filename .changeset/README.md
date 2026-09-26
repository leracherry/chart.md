# Release notes

Use `pnpm changeset` to describe user-facing changes to `@chartmd/core` or
`chartmd`. Commit the generated note alongside the change. Infrastructure-only
changes do not need a changeset.

Both packages start at `0.0.0` and remain private until the first usable release.
Private packages participate in versioning, but are not published or tagged.
There is no automated publishing workflow.

The initial comparison branch is `codex/repository-foundation`, the first branch
pushed to this empty repository. Update `baseBranch` in `config.json` if a
separate default branch is established.

Before a future release, establish the license and public API, remove the
package privacy flags, review package contents, and use `pnpm changeset version`
to apply pending release notes. Publishing requires a separate release decision.
