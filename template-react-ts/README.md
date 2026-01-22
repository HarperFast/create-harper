# your-project-name-here

## Installation

To get started, make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper), which can be done quickly:

```sh
npm install -g harperdb
```

## Development

Then you can start your app:

```sh
npm run dev
```

Navigate to [http://localhost:9926](http://localhost:9926) in a browser and view the functional web application.

For more information about getting started with HarperDB and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).

Take a look at the [default configuration](./config.yaml), which specifies how files are handled in your application.

The [schemas/exampleTable.graphql](schemas/exampleTable.graphql) is an example table schema definition. This is the main starting point for defining your database schema, specifying which tables you want and what attributes/fields they should have.

The [resources/greeting.ts](resources/greeting.ts) provides a template for defining TypeScript resource classes, for customized application logic in your endpoints.

## Deployment

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Make sure you've configured your [.env](.env) file with your secure cluster credentials. Don't commit this file to source control!

Then you can deploy your app to your cluster:

```sh
npm run deploy
```
