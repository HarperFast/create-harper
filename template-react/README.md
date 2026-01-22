# your-project-name-here

Your new app is now ready for development!

Here's what you should do next:

## Installation

To get started, make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper):

```sh
npm install -g harperdb
```

## Development

Then you can start your app:

```sh
npm run dev
```

### Define Your Schema

The [schemas/exampleTable.graphql](./schemas/exampleTable.graphql) is an example table schema definition. This is the main starting point for defining your database schema, specifying which tables you want and what attributes/fields they should have.

Open your [schemas/exampleTable.graphql](./schemas/exampleTable.graphql) to take a look at an example schema. You can add as many table definitions to a single schema file as you want. You can also create one file per schema.

These schemas are the heart of a great Harper app. This is the main starting point for defining your database schema, specifying which tables you want and what attributes/fields they should have. REST endpoints will get stood up for any table that you `@export`.

### Add Custom Endpoints

The [resources/greeting.js](./resources/greeting.js) provides a template for defining JavaScript resource classes, for customized application logic in your endpoints.

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

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Make sure you've configured your [.env](./.env) file with your secure cluster credentials. Don't commit this file to source control!

Then you can deploy your app to your cluster:

```sh
npm run deploy
```

## Keep Going!

For more information about getting started with Harper and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
