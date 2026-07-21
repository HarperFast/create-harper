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

Harper injects a `tables` global into server-side code, so server actions and server components read and write your database directly — no import needed:

```js
'use server';

export async function getCount() {
	const record = await tables.Count.get('count');
	return record?.value ?? 0;
}

export async function increment() {
	const current = await tables.Count.get('count');
	await tables.Count.put('count', {
		id: 'count',
		value: (current?.value ?? 0) + 1,
	});
}
```

> **Don't** add a top-level `import 'harper'` in these modules. It runs during the Next.js production build (when Next collects page data) and conflicts with the running database — use the injected `tables` global instead.

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

`npm run deploy` uploads the component and Harper builds the Next.js app on the server when it starts — no local build required.

## Keep Going!

For more on building Harper applications, see the [getting started guide](https://docs.harperdb.io/docs).

For more on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
