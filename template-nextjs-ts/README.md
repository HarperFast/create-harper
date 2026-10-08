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
your-package-manager-run-here dev
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

Your app deploys from GitHub: every pull request runs lint, and merging to `main` deploys to your Harper cluster with the included [GitHub Actions workflow](./.github/workflows/deploy.yaml). No Harper password or token is stored in GitHub.

First, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in, and create a cluster. Then log your local CLI in to it as a super user:

```sh
harper login
```

### How the workflow authenticates

The workflow runs plain `harper` commands, such as `harper deploy`, with no credentials on them. Each one authenticates by itself, because:

- the deploy job has `permissions: id-token: write`, so the CLI can ask GitHub for an identity token for the run;
- `HARPER_CLI_TARGET` is set to your cluster's URL, so the CLI asks for a token addressed to that cluster;
- the cluster holds a **trust policy** that accepts tokens from this repository's `deploy.yaml`, on `main`, in the `production` environment, and lets them act as a deploy-only user.

The CLI trades the token for a one-hour Harper token, and the run prints which policy it used, like `Authenticated as 'my-app-ci-deploy' via OIDC trust policy 'github-actions-my-app'`. Every `harper` command in that job works the same way, so you can add more steps without adding credentials.

### One-time setup

Push the project to a GitHub repository, then run this from the project on your machine. It needs Harper 5.4 or later (`npm install --global harper`):

```sh
your-package-manager-run-here deploy:setup-ci
```

It creates, on the cluster:

- a role that can run only `deploy_component` and `get_job` (to wait for the rollout), and a user in it;
- the trust policy, checked against your `.github/workflows/deploy.yaml` so it matches what a run will present.

With the [`gh` CLI](https://cli.github.com) signed in, it also sets the `HARPER_CLI_TARGET` repository variable; otherwise it prints the command to run. Running it again changes nothing. If something on the cluster already exists and differs, it stops and says what, without changing anything.

Then merge to `main`, or run the workflow from the **Actions** tab, to deploy.

The deploy user can deploy any app on the cluster, so who can deploy comes down to who can merge to `main`. Protect `main` under **Settings → Branches**, and if you want a person to approve each release, add a required reviewer to the `production` environment under **Settings → Environments**.

### What a deploy does

The workflow runs `next build` and uploads the project with its `.next` build, so no build runs on the cluster (building there currently fails; see the note in [`config.yaml`](./config.yaml)). It deploys with `restart=rolling`: each node restarts in turn, so the cluster keeps serving. On Harper 5.4 and later, each node first loads the release in a canary worker, and only serves it if it loads. A release that fails to load is rejected, the run fails and names the node, and the previous release keeps serving.

The run's summary names the deployment and its `certification`:

- `certified`: the canary loaded the release.
- `uncertified` or `unavailable`: the release went out without that check, for a reason the [deploy reference](https://docs.harperdb.io/reference/v5/operations-api/operations#certifying-a-release-in-a-canary-worker) lists.

### Going back to an earlier release

Each node keeps the releases a deploy replaces. List them, then activate one by its `deployment_id`; nothing is reinstalled:

```sh
harper list_deployments project=your-component-name-here
harper deploy project=your-component-name-here deployment_id=<id> restart=rolling
```

To have a person decide when a release goes live, deploy with `activate=false` instead: it installs the release without serving it, and prints a `deployment_id` you activate later with the second command above.

### Deploying by hand

```sh
your-package-manager-run-here deploy
```

builds and deploys this directory the same way, as the user you logged in with. It returns once the first node has the release; the response's `restartJobId` is the job that takes it to the others, which `harper get_job id=<restartJobId>` reports on.

### When a run is refused

If the deploy step fails with a 401, the cluster did not accept the run's token. `harper list_oidc_trust` shows each policy, and an `invalid_reason` when one can't match; the cluster's `oidc-trust` log says which check failed. Rerunning `your-package-manager-run-here deploy:setup-ci` reports a policy that no longer matches the workflow.

### Moving from the earlier workflow

Projects created before this deployed on version tags with a `HARPER_CLI_REFRESH_TOKEN` secret, and don't have this workflow or the `deploy:setup-ci` script. To move one over:

1. Scaffold a new project with the same name and template, using the package manager your project uses (for example `pnpm create harper`), and copy its `.github/workflows/deploy.yaml` over yours.
2. Run the setup from the project, with the `project=` value the copied workflow passes to `harper deploy`: `harper deploy setup=true provider=github-actions project=<that value>`.
3. Push the new workflow to `main`.
4. Once nothing references it, delete the `HARPER_CLI_REFRESH_TOKEN` secret under **Settings → Secrets and variables → Actions**. The new workflow doesn't read it, so it is only a credential left lying around.

### Private npm dependencies

The cluster installs your dependencies itself. If any come from a private npm registry, give the cluster a read-only token for it once. It is encrypted on your machine, and only the ciphertext is stored:

```sh
harper deploy setup=true provider=npm project=your-component-name-here registry=https://npm.pkg.github.com scope=@your-org
```

Leave out `registry=` and `scope=` for a private package on npmjs.com.

## Keep Going!

For more on building Harper applications, see the [getting started guide](https://docs.harperdb.io/docs).

For more on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
