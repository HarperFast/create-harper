# your-project-name-here

Your new app is now deployed and running on Harper Fabric!

Here's what you should do next:

### 1. Define Your Schema

Open your [schema.graphql](./schema.graphql) and tap [+ New Table](./schema.graphql?ShowNewTableModal=true). This is
your table schema definition, and is the heart of a great Harper app. This is the main starting point for defining your
[database schema](./databases), specifying which tables you want and what attributes/fields they should have. REST
endpoints will get stood up for any table that you `@export`.

### 2. Add Custom Endpoints

The [resources.js](./resources.js) provides a template for defining JavaScript resource classes for customized
application logic in your endpoints.

### 3. View Your Website

Pop open [http://localhost:9926](http://localhost:9926) to view [web/index.html](./web/index.html) in your browser.

### 4. Use Your API

Head to the [APIs](./apis) tab to explore your endpoints and exercise them. You can click the "Authenticate" button to
see what different users will be able to access through your API.

## Keep Going!

For more information about getting started with Harper and building applications, see
our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see
the [Components documentation](https://docs.harperdb.io/docs/reference/components).
