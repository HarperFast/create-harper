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
npm run dev
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

Deploy your app to a Harper cluster **by reference**: rather than uploading a snapshot of your files, you tell Harper which commit of your GitHub repository to run, pinned by its exact commit SHA. Re-deploying the same commit is repeatable, and rolling back is just deploying an older commit.

First, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in, and create a cluster. Then log your local CLI in to it:

```sh
harper login
```

### One-time setup

So the cluster can clone your (private) repository, register a read-only SSH **deploy key**:

```sh
npm run deploy:setup
```

This generates the key, registers it with your cluster, and prints a public key to add to your repository under **Settings → Deploy keys**. A deploy key is scoped to this one repository and keeps working even if the person who created it leaves. (It uses Harper's `add_ssh_key`, available on Harper Pro / Fabric.)

### Deploy

```sh
npm run deploy
```

This deploys the current commit — commit and push first, since the cluster clones from GitHub and only sees pushed commits. To roll back, check out an older commit and run it again.

### Deploy automatically from CI

The included [GitHub Actions workflow](./.github/workflows/deploy.yaml) deploys whenever you push a version tag:

```sh
git tag v1.0.0
git push --tags
```

Add these repository secrets first, under **Settings → Secrets and variables → Actions**:

- `CLI_TARGET` — your cluster's operations URL (e.g. `https://your-cluster.harperdb.io:9925`)
- `HARPER_CLI_USERNAME` and `HARPER_CLI_PASSWORD` — a cluster user allowed to deploy

### Other options

- **Public repository?** Skip the deploy key and let Harper clone over HTTPS (`git+https://…#<sha>`) with no cluster-side credentials.
- **Prefer to build in CI** instead of on your Harper nodes? Publish your app to a registry such as GitHub Packages and deploy it by version using `registryAuth`.

See the [Harper deployment docs](https://docs.harperdb.io/reference/v5/components/applications#deploy_component) for both.

## Keep Going!

For more information about getting started with Harper and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
