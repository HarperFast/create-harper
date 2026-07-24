# your-project-name-here

A type-safe [Next.js](https://nextjs.org) app running on Harper via [`@harperfast/nextjs`](https://github.com/HarperFast/nextjs). Your new app is now ready for development!

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

Your tables live in [`schema.graphql`](./schema.graphql). The starter defines a single `Count` table; add your own `@table` types there, then mirror their shape in [`harper.d.ts`](./harper.d.ts) so your server code stays type-safe. (The `@harperfast/schema-codegen` component can also generate these types for you.)

### Access Harper From Server Code

Harper injects `tables` and `transaction` globals into server-side code, so server actions and server components read and write your database directly — no import needed (their types come from [`harper.d.ts`](./harper.d.ts)). Use an atomic `addTo` inside a `transaction` for writes that stay correct when requests overlap across worker threads and replicated nodes (a read-then-write would lose concurrent increments):

```ts
'use server';

export async function getCount(): Promise<number> {
	const record = await tables.Count.get('count');
	return record?.value ?? 0;
}

export async function increment(): Promise<void> {
	await transaction(async () => {
		const record = await tables.Count.update('count');
		record.addTo('value', 1);
	});
}
```

> **Don't** add a top-level `import 'harper'` in these modules. It runs during the Next.js production build (when Next collects page data) and conflicts with the running database — use the injected globals instead.

Put data access in **server actions** (see [`app/actions.ts`](./app/actions.ts)) so that both server _and_ client components can share the same functions. Any action a client can reach is a public endpoint, so add your own authorization checks before shipping mutations that matter.

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

## Keep Going!

For more on building Harper applications, see the [getting started guide](https://docs.harperdb.io/docs).

For more on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
