# your-project-name-here

A type-safe [Next.js](https://nextjs.org) app running on Harper via [`@harperfast/nextjs`](https://github.com/HarperFast/nextjs). Your new app is now ready for development!

Because the app runs _inside_ Harper, server-side code (server actions and server components) can read and write your database directly through the [Resource API](https://docs.harperdb.io/docs/technical-details/reference/resources) — no separate API server and no network round-trip.

Here's what you should do next:

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

The included **Doggy Management System** demo shows the whole pattern end to end:

- [`schema.graphql`](./schema.graphql) defines a `Dog` table.
- [`harper.d.ts`](./harper.d.ts) declares the matching types for the `tables` global.
- [`app/actions.ts`](./app/actions.ts) defines server actions (`listDogs`, `getDog`, `createDog`, `deleteDog`) that talk to `tables` with full type safety.
- [`app/dogs/page.tsx`](./app/dogs/page.tsx) (a server component) and [`app/ui/DeleteButton.tsx`](./app/ui/DeleteButton.tsx) (a client component) both call those same actions.

### Define Your Schema

1. Edit [`schema.graphql`](./schema.graphql) (or add more `.graphql` files).
2. Craft your schema by hand — every `@table` becomes available on the `tables` global.
3. Mirror the shape in [`harper.d.ts`](./harper.d.ts) so your server code stays type-safe. (The `@harperfast/schema-codegen` component can also generate these types for you.)
4. Save your changes.

### Access Harper From Server Code

Harper injects a `tables` global into server-side code, so server actions and server components read and write your database directly — no import needed. The `tables` types come from [`harper.d.ts`](./harper.d.ts):

```ts
'use server';

import type { DogRecord } from '@/harper';

export async function listDogs(): Promise<DogRecord[]> {
	const dogs: DogRecord[] = [];
	for await (const dog of tables.Dog.search()) {
		dogs.push(dog);
	}
	return dogs;
}
```

> **Don't** add a top-level `import 'harper'` in these modules. It runs during the Next.js production build (when Next collects page data) and conflicts with the running database — use the injected `tables` global instead.

Following Next.js best practices, put this data access in **server actions** so that both server _and_ client components can share the same functions.

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

`npm run deploy` uploads the component and Harper builds the Next.js app on the server when it starts — no local build required. For faster startups you can instead deploy a prebuilt app: run it once with `npm run dev` (so Harper links its runtime into `node_modules`), then `npm run build`, add `prebuilt: true` under `@harperfast/nextjs` in [`config.yaml`](./config.yaml), and deploy.

## Keep Going!

For more on building Harper applications, see the [getting started guide](https://docs.harperdb.io/docs).

For more on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
