# Extending Table Resources in Harper

In Harper, when you define a table in GraphQL and export it, you can extend the automatically generated resource class to add custom logic, validation, or hooks to standard CRUD operations.

## Do you need to extend tables?

Exported tables have [automatic APIs](./automatic-apis.md) as a part of them. These APIs may be sufficient for what you need.

## How to Extend a Table Resource

1. Identify the table you want to extend (e.g., `ExamplePeople`).
2. Create a TypeScript file in your `resources/` folder.
3. Export a class that extends `tables.YourTableName`.
4. Override the desired methods (e.g., `post`, `get`, `put`, `patch`, `delete`).

### Example: `resources/examplePeople.ts`

```typescript
import { type RequestTargetOrId, tables } from 'harperdb';

export interface ExamplePerson {
	id: string;
	name: string;
	tag: string;
}

// Extend the automatically generated table resource
export class ExamplePeople extends tables.ExamplePeople<ExamplePerson> {
	// Override the custom POST handler
	async post(target: RequestTargetOrId, newRecord: Omit<ExamplePerson, 'id'>) {
		// Add custom validation or transformation logic
		if (!newRecord.name) {
			throw new Error('Name is required');
		}

		console.log(`Adding new person: ${newRecord.name}`);

		// Call the super method to perform the actual insertion
		return super.post(target, newRecord);
	}

	// Override the custom GET handler
	async get(target: RequestTargetOrId) {
		const record = await super.get(target);
		// Modify the record before returning if necessary
		return record;
	}
}
```

## Why Extend Tables?

- **Validation**: Ensure data meets specific criteria before it's saved to the database.
- **Side Effects**: Send an email, trigger a webhook, or log an event when a record is created or updated.
- **Data Transformation**: Format or enrich data before it's returned to the client.
- **Access Control**: Add custom logic to determine if a user has permission to access or modify a specific record.

## Important Note

When you extend a table resource, Harper uses your custom class for all REST API interactions with that table. Make sure to call `super[method]` if you still want the default behavior to occur after your custom logic.

Extended tables do not need to be `@export`ed in their schema .graphql.

```graphql
type ExamplePerson @table {
	id: ID @primaryKey
	name: String
	tag: String @indexed
}
```
