![npm create harper](./README.svg)

<a href="https://npmjs.com/package/create-harper"><img src="https://img.shields.io/npm/v/create-harper" alt="npm package"></a>

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

- `vanilla`
- `vanilla-ts`
- `react`
- `react-ts`

You can use `.` for the project name to scaffold in the current directory.

## Auto-updates

`create-harper` will automatically check for newer versions on npm. If a newer version is available, it will automatically re-run the process using the latest version to ensure you are using the most up-to-date templates and features.

If you wish to disable this behavior, you can set the `CREATE_HARPER_SKIP_UPDATE` environment variable:

```bash
CREATE_HARPER_SKIP_UPDATE=true npm create harper@latest
```

## Shout Out

This project is based largely on the prior work of the Vite team on Create Vite:
https://github.com/vitejs/vite/tree/main/packages/create-vite
