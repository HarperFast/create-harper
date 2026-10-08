![npm create harper](./README.svg)

<a href="https://npmjs.com/package/create-harper"><img src="https://img.shields.io/npm/v/create-harper" alt="npm package"></a>

## Prerequisites

Before you begin, ensure you have the following tools installed on your machine:

- **Node.js**: `create-harper` requires a LTS version of Node.js, such as v22 or higher. You can download it from [nodejs.org](https://nodejs.org/).
- **Git**: You can install it from [git-scm.com](https://git-scm.com/).
- **Common Build Tools**: On some systems (like Linux or macOS), you might need additional build tools (e.g., `make`, `gcc`, `g++`) to install certain dependencies. These are often included in packages like `build-essential` on Ubuntu or via Xcode Command Line Tools on macOS.

## Scaffolding Your First Harper Project

With NPM:

```bash
npm create harper@latest
```

With Yarn:

```bash
yarn create harper
```

With PNPM:

```bash
pnpm create harper
```

With Bun:

```bash
bun create harper
```

With Deno:

```bash
deno init --npm harper
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a Harper + Vue project, run:

```bash
# npm 7+, extra double-dash is needed:
npm create harper@latest my-react-app -- --template react-ts

# yarn
yarn create harper my-react-app --template react-ts

# pnpm
pnpm create harper my-react-app --template react-ts

# Bun
bun create harper my-react-app --template react-ts

# Deno
deno init --npm harper my-react-app --template react-ts
```

Currently supported template presets include:

- `vanilla`, `vanilla-ts`
- `react`, `react-ts`, `react-ssr`, `react-ts-ssr`
- `vue`, `vue-ts`, `vue-ssr`, `vue-ts-ssr`
- `nextjs`, `nextjs-ts`

You can use `.` for the project name to scaffold in the current directory.

## Deployment

Every project comes with a GitHub Actions workflow that tests pull requests and deploys to your [Harper Fabric](https://fabric.harper.fast/) cluster when a change merges to `main`. It stores no Harper credential: the deploy job authenticates with GitHub's OIDC identity token, which the cluster accepts under a trust policy.

After you push the new project to GitHub, set that up once from the project, signed in to the cluster as a super user with `harper login` (Harper 5.4 or later):

```bash
npm run deploy:setup-ci
```

It creates a deploy-only user and the trust policy on the cluster, and sets the workflow's `HARPER_CLI_TARGET` repository variable. Each project's README covers the rest: going back to an earlier release, staging a release, and what to do when a run is refused.

Projects created before this deploy on version tags with a stored `HARPER_CLI_REFRESH_TOKEN`. To move one over, scaffold a new project with the same name, template and package manager, copy its `.github/workflows/deploy.yaml` over yours, run `harper deploy setup=true provider=github-actions project=<the workflow's project= value>`, push, and then delete the old secret.

## Auto-updates

`create-harper` will automatically check for newer versions on npm. If a newer version is available, it will automatically re-run the process using the latest version to ensure you are using the most up-to-date templates and features.

If you wish to disable this behavior, you can set the `CREATE_HARPER_SKIP_UPDATE` environment variable:

```bash
CREATE_HARPER_SKIP_UPDATE=true npm create harper@latest
```

## Shout Out

This project is based largely on the prior work of the Vite team on Create Vite:
https://github.com/vitejs/vite/tree/main/packages/create-vite
