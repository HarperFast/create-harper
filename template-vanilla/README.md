# Your New Harper Fabric App

This is a template for building [Harper](https://www.harper.fast/) applications. You can download this repository as a starting point for building applications with Harper.

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

Test your application works by querying the `/Greeting` endpoint:

```sh
curl http://localhost:9926/Greeting
```

You should see the following:

```json
{"greeting":"Hello, world!"}
```

Navigate to [http://localhost:9926](http://localhost:9926) in a browser and view the functional web application.

For more information about getting started with HarperDB and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).

Take a look at the [default configuration](./config.yaml), which specifies how files are handled in your application.

The [schema.graphql](./schema.graphql) is the table schema definition. This is the main starting point for defining your database schema, specifying which tables you want and what attributes/fields they should have.

The [resources.js](./resources.js) provides a template for defining JavaScript resource classes, for customized application logic in your endpoints.


## Deployment

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Set up your .env file with your secure cluster credentials. Don't commit this file to source control!

```sh
npm run login
```

Then you can deploy your app to your cluster:

```sh
npm run deploy
```
