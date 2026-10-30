# your-project-name-here

Your new app is now ready for development!

Here's what you should do next:

## Installation

To get started, make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper):

```sh
npm install -g harper
```

## Development

Then you can start your app:

```sh
your-package-manager-run-here dev
```

TypeScript is supported at runtime in Node.js through [type stripping](https://nodejs.org/api/typescript.html#type-stripping). Full TypeScript language support can be enabled through integrating third party build steps to transpile your TypeScript into JavaScript.

### Define Your Schema

1. Create a new yourTableName.graphql file in the [schemas](./schemas) directory.
2. Craft your schema by hand.
3. Save your changes.

These schemas are the heart of a great Harper app, specifying which tables you want and what attributes/fields they should have. Any table you `@export` stands up [endpoints automatically](./.agents/skills/harper-best-practices/rules/automatic-apis.md).

### Add Custom Endpoints

1. Create a new greeting.ts file in the [resources](./resources) directory.

2. Customize your resource:

   ```typescript
   import { type RecordObject, type RequestTargetOrId, Resource } from 'harper';

   interface GreetingRecord {
   	greeting: string;
   }

   export class Greeting extends Resource<GreetingRecord> {
   	static loadAsInstance = false;

   	async post(
   		target: RequestTargetOrId,
   		newRecord: Partial<GreetingRecord & RecordObject>,
   	): Promise<GreetingRecord> {
   		// By default, only super users can access these endpoints.
   		return { greeting: 'Greetings, post!' };
   	}

   	async get(target?: RequestTargetOrId): Promise<GreetingRecord> {
   		// But if we want anyone to be able to access it, we can turn off the permission checks!
   		target.checkPermission = false;
   		return { greeting: 'Greetings, get! ' + process.version };
   	}

   	async put(
   		target: RequestTargetOrId,
   		record: GreetingRecord & RecordObject,
   	): Promise<GreetingRecord> {
   		target.checkPermission = false;
   		if (this.getCurrentUser()?.name?.includes('Coffee')) {
   			// You can add your own authorization guards, of course.
   			return new Response('Coffee? COFFEE?!', { status: 418 });
   		}
   		return { greeting: 'Sssssssssssssss!' };
   	}

   	async patch(
   		target: RequestTargetOrId,
   		record: Partial<GreetingRecord & RecordObject>,
   	): Promise<GreetingRecord> {
   		return { greeting: 'We can make this work!' };
   	}

   	async delete(target: RequestTargetOrId): Promise<boolean> {
   		return true;
   	}
   }
   ```

3. Save your changes.

### View Your Website

Pop open [http://localhost:9926](http://localhost:9926) to view [web/index.html](./web/index.html) in your browser.

### Use Your API

Test your application works by querying the `/Greeting` endpoint:

```sh
curl http://localhost:9926/Greeting
```

You should see the following:

```json
{ "greeting": "Hello, world!" }
```

### Configure Your App

Take a look at the [default configuration](./config.yaml), which specifies how files are handled in your application.

## Deployment

Your app deploys from GitHub: every pull request runs the tests, and merging to `main` deploys to your Harper cluster with the included [GitHub Actions workflow](./.github/workflows/deploy.yaml). No Harper password or token is stored in GitHub.

First, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in, and create a cluster. Then log your local CLI in to it as a super user:

```sh
harper login
```

### How the workflow authenticates

The workflow deploys with [`HarperFast/deploy-action`](https://github.com/HarperFast/deploy-action), which runs the `harper` CLI with no credentials on it. The CLI authenticates by itself, because:

- the deploy job has `permissions: id-token: write`, so the CLI can ask GitHub for an identity token for the run;
- the `HARPER_CLI_TARGET` repository variable holds your cluster's URL, so the CLI asks for a token addressed to that cluster;
- the cluster holds a **trust policy** that accepts tokens from this repository's `deploy.yaml`, on `main`, in the `production` environment, and lets them act as a deploy-only user.

The CLI trades the token for a one-hour Harper token, and the run prints which policy it used, like `Authenticated as 'my-app-ci-deploy' via OIDC trust policy 'github-actions-my-app'`. Install the CLI in that job and any `harper` command you add works the same way, without adding credentials.

### One-time setup

Push the project to a GitHub repository, then run this from the project on your machine. It needs Harper 5.4 or later (`npm install --global harper`):

```sh
your-package-manager-run-here deploy:setup-ci
```

It creates, on the cluster:

- a role that can run only `deploy_component`, `get_deployment` and `get_job` (to follow the rollout) and `registration_info` (the CLI's version check), and a user in it;
- the trust policy, checked against your `.github/workflows/deploy.yaml` so it matches what a run will present.

With the [`gh` CLI](https://cli.github.com) signed in, it also sets the `HARPER_CLI_TARGET` repository variable; otherwise it prints the command to run. Running it again changes nothing. If something on the cluster already exists and differs, it stops and says what, without changing anything.

Then merge to `main`, or run the workflow from the **Actions** tab, to deploy.

The deploy user can deploy any app on the cluster, so who can deploy comes down to who can merge to `main`. Protect `main` under **Settings → Branches**, and if you want a person to approve each release, add a required reviewer to the `production` environment under **Settings → Environments**.

### What a deploy does

The workflow uploads the checked-out project and deploys it with `restart=rolling`: each node restarts in turn, so the cluster keeps serving. On Harper 5.4 and later, the run waits for every node, and each node first loads the release in a canary worker and only serves it if it loads. A release that fails to load is rejected, the run fails and names the node, and the previous release keeps serving.

The deploy step's log names the deployment and its `certification`:

- `certified`: the canary loaded the release.
- `uncertified` or `unavailable`: the release went out without that check, for a reason the [deploy reference](https://docs.harperdb.io/reference/v5/operations-api/operations#certifying-a-release-in-a-canary-worker) lists.

### Going back to an earlier release

Each node keeps the releases a deploy replaces. List them, then activate one by putting its `deployment_id` in place of `DEPLOYMENT_ID`; nothing is reinstalled:

```sh
harper list_deployments project=your-component-name-here
harper deploy project=your-component-name-here deployment_id=DEPLOYMENT_ID restart=rolling
```

To have a person decide when a release goes live, deploy with `activate=false` instead: it installs the release without serving it, and prints a `deployment_id` you activate later with the second command above.

### Deploying by hand

```sh
your-package-manager-run-here deploy
```

deploys this directory the same way, as the user you logged in with. It returns once the first node has the release; the response's `restartJobId` is the job that takes it to the others, which `harper get_job id=<restartJobId>` reports on.

### Pull request previews

Turn these on and every pull request from a branch in this repository gets its own running copy of the app, at `https://<branch>.app.<your-cluster-host>/`, with its own branch of your databases. A comment on the pull request links to it. Each push updates it, and closing the pull request removes it; a preview that misses that expires after seven days.

The [preview workflow](./.github/workflows/preview.yaml) skips its jobs until you turn previews on. That takes Harper 5.4 or later on the cluster and on your machine. Run this once from the project, signed in as a super user:

```sh
your-package-manager-run-here deploy:setup-previews
```

It refuses a workflow that could hand the preview identity to a fork or to a pull request's code. Then it creates, on the cluster, a user that can only deploy and drop this app's previews, and trust policies for the workflow's `preview` and `preview-cleanup` environments. With the [`gh` CLI](https://cli.github.com) signed in, it also sets the `HARPER_PREVIEW_TARGET` repository variable, which is what turns the jobs on; otherwise it prints the command to run. To remove it all, previews included, run `harper preview teardown app=your-component-name-here`.

The workflow never checks out or builds a pull request. The cluster fetches the commit itself, then installs and builds it there, so anyone who can push a branch here can run code on your cluster, in an isolated worker. A preview's writes stay in its own database branch, except in the `system` database (users and roles), which can't be branched.

- **Private repositories:** the cluster needs a credential to fetch each commit. Setup offers to seal one, and the workflow uses it whenever the repository is private.
- **Public repositories:** the workflow runs on `pull_request_target`, which [GitHub's default protection](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target) blocks for affected public repositories from December 2, 2026. A blocked run fails with an error, even while previews are off. To allow it, go to **Settings → Actions → Policies**, create a policy with an active enforcement status that targets `.github/workflows/preview.yaml`, and add a **Restrict events** rule that allows `pull_request_target`. If you don't want previews, delete the workflow instead.
- **Forks:** pull requests from forks get no preview, and the cluster is never called for them.
- **Approvals:** to have a person approve each preview, add a required reviewer to the `preview` environment under **Settings → Environments**. Leave `preview-cleanup` without one, so closing a pull request never waits for an approval.

The [deploy action's documentation](https://github.com/HarperFast/deploy-action#pull-request-previews) covers the rest, such as using another domain and sweeping missed previews.

### When a run is refused

If the deploy step fails with a 401, the cluster did not accept the run's token. `harper list_oidc_trust` shows each policy, and an `invalid_reason` when one can't match; the cluster's `oidc-trust` log says which check failed. Rerunning `your-package-manager-run-here deploy:setup-ci` reports a policy that no longer matches the workflow.

### Moving from the earlier workflow

Projects created before this deployed on version tags with a `HARPER_CLI_REFRESH_TOKEN` secret, and don't have this workflow or the `deploy:setup-ci` script. To move one over:

1. Scaffold a new project with the same name and template, using the package manager your project uses (for example `pnpm create harper`), and copy its `.github/workflows/deploy.yaml` over yours.
2. Run the setup from the project, with the `app:` value the copied workflow passes to the deploy action: `harper deploy setup=true provider=github-actions project=<that value>`.
3. Push the new workflow to `main`.
4. Once nothing references it, delete the `HARPER_CLI_REFRESH_TOKEN` secret under **Settings → Secrets and variables → Actions**. The new workflow doesn't read it, so it is only a credential left lying around.

### Private npm dependencies

The cluster installs your dependencies itself. If any come from a private npm registry, give the cluster a read-only token for it once. It is encrypted on your machine, and only the ciphertext is stored:

```sh
harper deploy setup=true provider=npm project=your-component-name-here registry=https://npm.pkg.github.com scope=@your-org
```

Leave out `registry=` and `scope=` for a private package on npmjs.com.

## Keep Going!

For more information about getting started with Harper and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
