# your-project-name-here

Your new app is now deployed and running on Harper Fabric!

Here's what you should do next:

### Define Your Schema

Tap [+ New Table](./schemas/exampleTable.graphql?ShowNewTableModal=true) when viewing a schema file, and you'll be guided through the available options.

The [schemas/exampleTable.graphql](./schemas/exampleTable.graphql) is an example table schema definition. This is the main starting point for defining your [database schema](./databases), specifying which tables you want and what attributes/fields they should have.

Open your [schemas/exampleTable.graphql](./schemas/exampleTable.graphql) to take a look at an example schema. You can add as many table definitions to a single schema file as you want. You can also create one file per schema.

These schemas are the heart of a great Harper app. This is the main starting point for defining your [database schema](./databases), specifying which tables you want and what attributes/fields they should have. REST endpoints will get stood up for any table that you `@export`.

### Add Custom Endpoints

The [resources/greeting.js](./resources/greeting.js) provides a template for defining JavaScript resource classes, for customized application logic in your endpoints.

### View Your Website

Pop open [http://localhost:9926](http://localhost:9926) to view [web/index.html](./web/index.html) in your browser.

### Use Your API

Head to the [APIs](./apis) tab to explore your endpoints and exercise them. You can click the "Authenticate" button to
see what different users will be able to access through your API.

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

## Keep Going!

For more information about getting started with Harper and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
