# End-to-end tests

These tests scaffold a real app with the create-harper CLI, exercise it against a **real Harper
instance**, and let you pin **which version of Harper** to run against — so we can catch, ahead
of a Harper release, anything that would break a generated app: changed API surfaces, new
instability, or defaults create-harper needs to follow.

This is the deeper tier above [`../runtimeSmoke.js`](../runtimeSmoke.js) (the fast per-PR check).
It shares the same isolated-Harper boot module, [`harper.js`](./harper.js).

## Running locally

```bash
# One template against the latest published Harper:
npm run test:e2e -- --template react-ts

# Against the leading edge (the `next` dist-tag), or any npm spec:
npm run test:e2e -- --template react-ts --harper next
npm run test:e2e -- --template vue-ts   --harper 5.2.0-beta.1

# Against an UNPUBLISHED Harper, built from a git branch / tag / full commit sha:
npm run test:e2e -- --template react-ts --harper-ref my-feature-branch
npm run test:e2e -- --template react-ts --harper-ref 1e1edc666ad373a0fbfec4df4d3f0e130be13529
npm run test:e2e -- --template react-ts --harper-ref my-branch --harper-repo https://github.com/me/harper.git

# Reuse a Harper you already have installed/built (skips resolution entirely):
HARPER_BIN=/path/to/node_modules/.bin/harper npm run test:e2e -- --template vanilla-ts

# Keep the generated app around to inspect a failure:
npm run test:e2e -- --template react-ts --keep
```

How Harper is resolved, in precedence order:

- `HARPER_BIN` (env) — an existing install or build; `run.js` uses it as-is. A `.js` path (e.g. a
  source build's `dist/bin/harper.js`) is launched via `node`.
- `--harper-ref <sha|branch|tag>` — clone `harperfast/harper` (public; override with
  `--harper-repo`), `npm install` + `npm run build`, and run its `dist/bin/harper.js`. This tests
  an unpublished Harper straight from a commit. Heaviest path (full install + `tsc` build). A commit
  ref must be a **full 40-char sha** (git can't fetch a short sha directly); branches and tags work
  as-is. The `build` script is `tsc` and Harper's `main` isn't always type-green, so — like Harper's
  own `build-tools/build.sh` (`npm run build || true`) — a non-zero build exit is tolerated as long
  as `dist/bin/harper.js` was emitted.
- `--harper <spec>` (default `latest`) — `npm install harper@<spec>` into an isolated prefix. Any
  npm spec: `latest`, `next`, `5.2.0-beta.1`, a tarball, ...

Nothing is installed globally in any case.

## What a run does

[`run.js`](./run.js) drives one template end-to-end:

1. **Generate** the app with the real CLI (throwaway temp dir).
2. **Overlay** e2e fixtures ([`overlay.js`](./overlay.js)) — see "no cruft" below.
3. **Install** the app's dependencies.
4. **Resolve Harper** (no global install): a published version via npm, or an unpublished build
   from a git ref — see the precedence list above.
5. **Build** the app if it has a build step.
6. **Playwright** ([`playwright.config.js`](./playwright.config.js)) boots one isolated Harper via
   [`globalSetup.js`](./globalSetup.js), seeds a known record, and runs the specs against it.

## Scenarios

Every template runs the API specs (CRUD + custom resource — the framework-agnostic Harper
surface). SPA templates additionally run the frontend-served and browser specs.

| Spec                                           | What it proves                                                                                                                      | Templates                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| [`crud.spec.js`](./specs/crud.spec.js)         | Schema-driven auto-REST CRUD lifecycle (create/read/update/filter/delete), with the exact status codes asserted as a version canary | all                         |
| [`resource.spec.js`](./specs/resource.spec.js) | A custom `resources/` class loads and answers GET with its own JSON                                                                 | all                         |
| [`frontend.spec.js`](./specs/frontend.spec.js) | The frontend is served at `/`                                                                                                       | react / vue / vanilla (SPA) |
| [`browser.spec.js`](./specs/browser.spec.js)   | A real framework component fetches the auto-REST API and renders the data in a browser                                              | react / vue / vanilla (SPA) |

> Note: there is **no GraphQL query-over-HTTP endpoint** in Harper (verified: `/graphql` → 404).
> "GraphQL" in the templates means the schema definition language plus the auto-generated REST +
> WebSocket APIs — which is what these specs exercise.

## No cruft in real users' apps

The fixtures under [`fixtures/`](./fixtures) are **only** ever copied into throwaway generated
copies, never into the `template-*/` sources, and `template.tests/` is excluded from the npm
`files` allowlist. So none of this can reach a user's scaffolded app or the published package.

- **Shared** ([`fixtures/shared`](./fixtures/shared)) — a schema (`E2eWidget`) + a custom resource
  (`E2eEcho`), applied to every template. This is Harper's API surface, which is framework-agnostic.
- **Framework** ([`fixtures/react`](./fixtures/react), [`fixtures/vue`](./fixtures/vue)) — a
  component that fetches `E2eWidget` and renders it, mounted into the app's entry by
  [`overlay.js`](./overlay.js). Vanilla gets an equivalent plain-DOM overlay.

## CI

- **Per PR** — the fast `runtimeSmoke.js` check (via `.github/workflows/integration.yaml`), against
  the latest published Harper.
- **Nightly + on demand** — `.github/workflows/e2e.yaml` runs this suite. The scheduled run tests
  `latest` **and** `next` across a representative template subset and files an issue if the `next`
  canary breaks. `workflow_dispatch` takes `harper-version` (an npm spec), `harper-ref` (a git
  commit/branch/tag to build from source — overrides `harper-version`), and optional `template`.

## Extending

- **SSR frontend + browser coverage**: SSR templates (`*-ssr`) currently run the API specs only.
  Two things differ from SPA: their entry is an `entry-client`/`entry-server` split rather than a
  single `main` (so the component overlay is gated off — `capabilities.js` → `browser: false`), and
  their `static` handler sets `index: false` so `/` is served by the SSR entry-server. In local
  validation that path returned **404 under `harper run`** — so the frontend spec is gated off for
  SSR too (`E2E_SSR`). Confirming the intended production SSR serving, then enabling both specs for
  SSR, is the natural next step (and a good first real use of this harness).
- **More scenarios**: add a `*.spec.js` under [`specs/`](./specs). API specs use the `request`
  fixture (authenticated as the seeded superuser); browser specs use `page` and should be gated on
  `E2E_BROWSER`.
- **New capabilities per template**: [`capabilities.js`](./capabilities.js) derives everything from
  the template name.
