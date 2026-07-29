# your-project-name-here

A [Next.js](https://nextjs.org) app running on Harper via [`@harperfast/nextjs`](https://github.com/HarperFast/nextjs). Your new app is now ready for development!

Because the app runs _inside_ Harper, server-side code (server actions and server components) reads and writes your database directly through the injected `tables` global — no separate API server and no network round-trip.

The starter ships one tiny end-to-end example: a counter stored in a Harper table, read by a server component and incremented by a server action.

## Installation

Make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper):

```sh
npm install -g harper
```

## Development

Start the app:

```sh
npm run dev
```

Then open [http://localhost:9926](http://localhost:9926) 🎉

Click the button — the count persists in Harper across reloads and restarts.

### Define Your Schema

Your tables live in [`schema.graphql`](./schema.graphql). The starter defines a single `Count` table; add your own `@table` types there and they become available on the `tables` global.

### Access Harper From Server Code

Harper injects `tables` and `transaction` globals into server-side code, so server actions and server components read and write your database directly — no import needed. Use an atomic `addTo` inside a `transaction` for writes that stay correct when requests overlap across worker threads and replicated nodes (a read-then-write would lose concurrent increments):

```js
'use server';

export async function getCount() {
	const record = await tables.Count.get('count');
	return record?.value ?? 0;
}

export async function increment() {
	await transaction(async () => {
		const record = await tables.Count.update('count');
		record.addTo('value', 1);
	});
}
```

> **Don't** add a top-level `import 'harper'` in these modules. It runs during the Next.js production build (when Next collects page data) and conflicts with the running database — use the injected globals instead.

Put data access in **server actions** (see [`app/actions.js`](./app/actions.js)) so that both server _and_ client components can share the same functions. Any action a client can reach is a public endpoint, so add your own authorization checks before shipping mutations that matter.

## Deployment

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Come back and log your local CLI into your cluster:

```sh
harper login
```

Then deploy your app:

```sh
npm run deploy
```

`npm run deploy` runs `next build` locally and ships the prebuilt `.next` output, then Harper serves it — no build runs on the cluster. (Building on the cluster currently fails; see the note in [`config.yaml`](./config.yaml).)

### Deploy automatically from CI

The included [GitHub Actions workflow](./.github/workflows/deploy.yaml) builds and deploys whenever you push a version tag:

```sh
git tag v1.0.0
git push --tags
```

Add these repository secrets first, under **Settings → Secrets and variables → Actions**:

- `HARPER_CLI_TARGET` — your cluster's operations URL (e.g. `https://your-cluster.harperdb.io:9925`)
- `HARPER_CLI_REFRESH_TOKEN` — a long-lived token CI authenticates with, so no password is stored

Set both in one command — this pipes the credentials straight from your cluster into GitHub, so the token never appears on screen or in your shell history:

```sh
harper login --for-ci | gh secret set --env-file -
```

(No [`gh` CLI](https://cli.github.com)? `harper login --for-ci | pbcopy` copies the two lines for you to paste in by hand.)

> **Why this template deploys differently.** The other create-harper templates deploy _by reference_: the cluster clones your repo at a pinned commit and builds there. Next.js can't do that yet — `.next` is gitignored, so a git reference carries no build output, and an on-cluster build currently fails ([nextjs#57](https://github.com/HarperFast/nextjs/issues/57), [nextjs#58](https://github.com/HarperFast/nextjs/issues/58)). Until those land, this template uploads the build itself.

## Keep Going!

For more on building Harper applications, see the [getting started guide](https://docs.harperdb.io/docs).

For more on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
