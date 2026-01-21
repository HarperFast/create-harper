# Contributing to Create Harper

Thank you for your interest in contributing! This document explains how to set up your environment, make changes safely, and submit high‑quality pull requests.

## Prerequisites

- Node.js (see .nvmrc file)
- npm (use the version pinned in `.nvmrc`)
- Git

After cloning, install dependencies and (optionally) set up git hooks:

```bash
npm install
```

## Development workflow

- Link the package: `npm link`
- Run int: `npm create harper`
- Lint: `npm run lint:fix`
- Format: `npm run format:fix`

## Commit conventions

We use Conventional Commits and commitlint to keep history clean and to power semantic-release.

Examples:

```
feat: add database browser filters
fix: normalize column widths in table view
chore(ci): update workflow names
```

- Lint your commit: `npm run commitlint --edit`
- If you want a commit-msg hook locally, you can add one (optional):
  ```bash
  # if a .husky directory is present in your clone
  npx husky add .husky/commit-msg 'npm commitlint --edit "$1"'
  ```

Useful types include: feat, fix, perf, refactor, chore, docs, style, test, build, ci, revert.

## Testing

- Framework: Vitest (see `vitest.config.ts`)
- Run once: `npm run test:run`
- Watch mode: `npm run test:watch`

Where practical, add or update unit tests for your changes.

## Linting and style

- Linting: OXLint (`npm run lint:check`, `npm run lint:fix`)
- Formatting: dprint (`npm run format:check`, `npm run format:fix`)

## Branching and pull requests

- Create feature branches from the main development branch.
- Keep PRs focused and reasonably small.
- Ensure `npm run test:run` and `npm run lint:check` and `npm run format:check` pass before requesting review.
- Use descriptive PR titles that align with Conventional Commits when possible.

Releases are automated from the `main` branch via semantic-release.

## Code review guidelines

- Prefer clear, readable code over “clever” code.
- Add comments where intent isn’t obvious.
- Avoid introducing unused dependencies.
- Keep changes backward compatible when feasible.

## Questions

If you’re unsure about anything, open a draft PR early or start a discussion. We’re happy to help get you unblocked quickly.
