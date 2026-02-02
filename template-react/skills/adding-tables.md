# Adding Tables to HarperDB

To add tables to a Harper database, follow these guidelines:

1. **Dedicated Schema Files**: Prefer having a dedicated schema `.graphql` file for each table. Check the `config.yaml` file under `graphqlSchema.files` to see how it's configured. It typically accepts wildcards (e.g., `schemas/*.graphql`), but may be configured to point at a single file.

2. **Directives**: All available directives for defining your schema are defined in `node_modules/harperdb/schema.graphql`. Common directives include `@table`, `@export`, `@primaryKey`, `@indexed`, and `@relationship`.

3. **Defining Relationships**: You can link tables together using the `@relationship` directive. For more details, see the [Defining Relationships](defining-relationships.md) skill.

4. **Automatic REST APIs**: If you add `@table @export` to a schema type, HarperDB automatically sets up REST APIs for basic CRUD operations against that table. For a detailed list of available endpoints and how to use them, see the [Automatic REST APIs](automatic-rest-apis.md) skill.

   - `GET /{TableName}`: Describes the schema itself.
   - `GET /{TableName}/`: Lists all records (supports filtering, sorting, and pagination via query parameters). See the [Querying REST APIs](querying-rest-apis.md) skill for details.
   - `GET /{TableName}/{id}`: Retrieves a single record by its ID.
   - `POST /{TableName}/`: Creates a new record.
   - `PUT /{TableName}/{id}`: Updates an existing record.
   - `PATCH /{TableName}/{id}`: Performs a partial update on a record.
   - `DELETE /{TableName}/`: Deletes all records or filtered records.
   - `DELETE /{TableName}/{id}`: Deletes a single record by its ID.

### Example

In `schemas/ExamplePerson.graphql`:

```graphql
type ExamplePerson @table @export {
	id: ID @primaryKey
	name: String
	tag: String @indexed
}
```

Tip: if you are going to [extend the table](./extending-tables.md) in your resources, then do not `@export` the table from the schema.
