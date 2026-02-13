# Custom Resources in Harper

Custom Resources allow you to define your own REST endpoints with custom logic by writing JavaScript or TypeScript code. This is useful when the automatic CRUD operations provided by `@table @export` are not enough.

Harper supports [TypeScript Type Stripping](typescript-type-stripping.md), allowing you to use TypeScript directly without additional build tools on supported Node.js versions.

## Do you need a custom resource?

Exported tables have [automatic APIs](./automatic-apis.md) as a part of them. These APIs may be enough for what you need. Take a look at [extendings tables](./extending-tables.md) to learn more about resources with a backing table.

## Defining a Custom Resource

To create a custom resource:

1. Create a `.ts` (or `.js`) file in the directory specified by `jsResource` in `config.yaml` (usually `resources/`).
2. Export a class that extends the `Resource` class from the `harperdb` module.

### Example: `resources/greeting.ts`

```typescript
import { type RecordObject, type RequestTargetOrId, Resource } from 'harperdb';

interface GreetingRecord {
	greeting: string;
}

export class Greeting extends Resource<GreetingRecord> {
	// Set to false if you want Harper to manage the instance lifecycle
	static loadAsInstance = false;

	async get(target?: RequestTargetOrId): Promise<GreetingRecord> {
		return { greeting: 'Hello from a custom GET endpoint!' };
	}

	async post(
		target: RequestTargetOrId,
		newRecord: Partial<GreetingRecord & RecordObject>,
	): Promise<GreetingRecord> {
		// Custom logic for handling POST requests
		return { greeting: `Hello, ${newRecord.greeting || 'stranger'}!` };
	}
}
```

## Supported HTTP Methods

You can implement any of the following methods in your resource class to handle the corresponding HTTP requests:

- `get(target?: RequestTargetOrId)`
- `post(target: RequestTargetOrId, body: any)`
- `put(target: RequestTargetOrId, body: any)`
- `patch(target: RequestTargetOrId, body: any)`
- `delete(target: RequestTargetOrId)`

The `target` parameter typically contains the ID or sub-path from the URL.

## Accessing Tables

Within your custom resource, you can easily access your database tables using the `tables` object:

```typescript
import { Resource, tables } from 'harperdb';

export class MyCustomResource extends Resource {
	async get() {
		// Query a table
		const results = await tables.ExamplePeople.list();
		return results;
	}
}
```

## Configuration

Ensure your `config.yaml` is configured to load your resources:

```yaml
jsResource:
  files: 'resources/*.ts'
```

Once defined and configured, your resource will be available at a REST endpoint matching the class name exactly.

### Case Sensitivity

Paths in Harper are **case-sensitive**. A resource class named `MyResource` will be accessible only at `/MyResource/`, not `/myresource/`.
