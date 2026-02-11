# Programmatic Requests with Harper Tables

In Harper, you can interact with your database tables programmatically using the global `tables` object. Each table defined in your schema is available as a property on this object.

## Basic Usage

The `tables` object provides a direct way to perform CRUD operations from within your Harper resources or scripts.

```typescript
const track = await tables.ExamplePeople.get(id) as ExamplePerson;
```

## Available Methods

The following methods are available on each table object:

### `get(idOrQuery)`

Retrieves a single record by ID or multiple records matching a query.

- **By ID**:
  ```typescript
  const person = await tables.ExamplePeople.get('person-123');
  ```
- **By Query**:
  ```typescript
  const albums = await tables.ExamplePeople.get({
  	conditions: [{ attribute: 'name', value: 'John' }],
  });
  ```

### `put(id, record)`

Replaces an entire record with the provided data. If the record doesn't exist, it will be created.

```typescript
await tables.ExamplePeople.put('person-123', {
	name: 'Michael Jackson',
	tag: 'entertainer',
});
```

### `patch(id, partialRecord)`

Performs a partial update on a record. Only the specified fields will be updated.

```typescript
await tables.ExamplePeople.patch('person-123', {
	tag: 'tragedy',
});
```

### `delete(idOrQuery)`

Deletes a record by ID or multiple records matching a query.

```typescript
await tables.ExamplePeople.delete('person-123');
```

### `post(record)`

Creates a new record. Use this when you want the database to auto-generate a primary key.

```typescript
const newAlbum = await tables.ExamplePeople.post({
	name: 'John Smith',
	tag: 'anonymous',
});
```

### `update(id, updates)`

The `update` method is a versatile tool for modifying records. While it can perform simple partial updates like `patch`, its primary power lies in its ability to return an **Updatable Record** object for complex or atomic operations.

#### Partial Update (like `patch`)

When called with both an ID and an update object, it performs a partial update:

```typescript
await tables.ExamplePeople.update('person-123', {
	name: 'Updated Name',
});
```

#### Getting an Updatable Record

When called without an update object (only an ID), `update` returns a reference to the record that can be modified directly.

```typescript
const person = await tables.ExamplePeople.update('person-123');
person.name = 'New Person Name';
// Properties can be assigned directly and are tracked
```

#### Atomic Operations

Updatable records provide methods for safe, atomic modifications, which are essential for avoiding race conditions during increments or decrements:

- `addTo(attribute, value)`: Atomically adds to a numeric value.
- `subtractFrom(attribute, value)`: Atomically subtracts from a numeric value.

```typescript
const stats = await tables.Stats.update('daily');
stats.addTo('viewCount', 1);
```

#### Update without an ID or with Context

Calling `update()` without an ID can be used when the target is implied by the context (e.g., inside a resource method) or when you want to get an updatable reference to a collection.

```typescript
// Inside a custom resource method
const record = await this.update();
record.set('status', 'processed');

// Passing specific context (like a transaction)
const person = await tables.ExamplePeople.update('person-123', null, {
	transaction,
});
person.addTo('playCount', 1);
```

### `search(query)`

Performs a search based on the provided query criteria. It returns an `AsyncIterable` which is efficient for streaming large result sets.

```typescript
const results = await tables.ExamplePeople.search({
	conditions: [{ attribute: 'artist', value: 'Michael Jackson' }],
});

for await (const person of results) {
	console.log(person.name);
}
```

### `subscribe(query)`

Subscribes to real-time changes in the table. You can provide a query to filter which changes trigger a notification.

```typescript
const subscription = await tables.ExamplePeople.subscribe({
	conditions: [{ attribute: 'name', value: 'Thriller' }],
});

for await (const event of subscription) {
	console.log('Record changed:', event.value);
}
```

### `publish(id, message)`

Publishes a message to a specific record or topic. This triggers any active subscriptions without necessarily persisting data to the table.

```typescript
await tables.ExamplePeople.publish('person-123', {
	type: 'REVALIDATE',
	timestamp: Date.now(),
});
```

## Querying Options

Many methods accept a `Query` (or `RequestTarget`) object. Common options include:

- `conditions`: Array of filter conditions.
- `limit`: Number of records to return.
- `offset`: Number of records to skip.
- `sort`: Attribute and direction for sorting.
- `select`: Array of specific attributes to return.

Example of a complex query:

```typescript
const recentAlbums = await tables.ExamplePeople.get({
	conditions: [{
		attribute: 'releaseDate',
		comparator: 'ge',
		value: '2020-01-01',
	}],
	sort: { attribute: 'releaseDate', descending: true },
	limit: 10,
});
```
