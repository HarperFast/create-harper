# Automatic APIs in Harper

When you define a GraphQL type with the `@table` and `@export` directives, Harper automatically generates a fully-functional REST API and WebSocket interface for that table. This allows for immediate CRUD (Create, Read, Update, Delete) operations and real-time updates without writing any additional code.

## Enabling Automatic APIs

To enable the automatic REST and WebSocket APIs for a table, ensure your GraphQL schema includes the `@export` directive:

```graphql
type MyTable @table @export {
	id: ID @primaryKey
	# ... other fields
}
```

## Available REST Endpoints

The following endpoints are automatically created for a table named `TableName` (Note: Paths are **case-sensitive**, so `GET /TableName/` is valid while `GET /tablename/` is not):

- **Describe Schema**: `GET /{TableName}`
  Returns the schema definition and metadata for the table.
- **List Records**: `GET /{TableName}/`
  Lists all records in the table. This endpoint supports advanced filtering, sorting, and pagination. For more details, see the [Querying REST APIs](querying-rest-apis.md) skill.
- **Get Single Record**: `GET /{TableName}/{id}`
  Retrieves a single record by its primary key (`id`).
- **Create Record**: `POST /{TableName}/`
  Creates a new record. The request body should be a JSON object containing the record data.
- **Update Record (Full)**: `PUT /{TableName}/{id}`
  Replaces the entire record at the specified `id` with the provided JSON data.
- **Update Record (Partial)**: `PATCH /{TableName}/{id}`
  Updates only the specified fields of the record at the given `id`.
- **Delete All/Filtered Records**: `DELETE /{TableName}/`
  Deletes all records in the table, or a subset of records if filtering parameters are provided.
- **Delete Single Record**: `DELETE /{TableName}/{id}`
  Deletes the record with the specified `id`.

## Automatic WebSockets

In addition to REST endpoints, Harper also stands up WebSocket interfaces for exported tables. When you connect to the table's endpoint via WebSocket, you will automatically receive events whenever updates are made to that table.

- **WebSocket Endpoint**: `ws://your-harper-instance/{TableName}`

This is the easiest way to add real-time capabilities to your application. For more complex real-time needs, see the [Real-time Applications](real-time-apps.md) skill.

## Filtering and Querying

The `GET /{TableName}/` and `DELETE /{TableName}/` endpoints can be filtered using query parameters. While basic equality filters are straightforward, Harper supports a rich set of operators, sorting, and pagination.

For a comprehensive guide on advanced querying, see the [Querying REST APIs](querying-rest-apis.md) skill.

## Customizing Resources

If the automatic APIs don't behave how you need, then you can look to [customize the resources](./custom-resources.md).
