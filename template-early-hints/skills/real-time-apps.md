# Real-time Applications in Harper

Harper provides built-in support for real-time data synchronization using WebSockets and a Pub/Sub mechanism. This allows clients to receive immediate updates when data changes in the database.

## Automatic WebSockets

For many use cases, the [Automatic APIs](automatic-apis.md) provided by Harper are more than enough. When you `@export` a table, Harper automatically provides a WebSocket endpoint that publishes events whenever data in that table is updated.

## Implementing a WebSocket Resource

Customizing resources by implementing a `connect` method is only necessary when you want to come up with a more specific back-and-forth or custom message handling. To handle WebSocket connections, implement the `connect` method in your custom resource class.

### Example: `resources/exampleSocket.ts`

```typescript
import {
	type IterableEventQueue,
	RequestTarget,
	Resource,
	tables,
} from 'harperdb';

export class ExampleSocket extends Resource {
	async *connect(
		target: RequestTarget,
		incomingMessages: IterableEventQueue<any>,
	): AsyncIterable<any> {
		// Subscribe to changes in a specific table
		const subscription = await tables.ExamplePeople.subscribe(target);

		if (!incomingMessages) {
			// Server-Sent Events (SSE) mode: only outgoing messages
			return subscription;
		}

		// Handle incoming messages from the client
		for await (let message of incomingMessages) {
			// Process message and optionally yield responses
			yield { received: message };
		}
	}
}
```

## Pub/Sub with `tables.subscribe()`

You can subscribe to change events on any table using the `subscribe()` method. This is typically used within the `connect` method of a resource to stream updates to a connected client.

- `tables.TableName.subscribe(target)`: Subscribes to all changes in the specified table.
- The `target` parameter can include filters to only subscribe to a subset of changes.

## Server-Sent Events (SSE)

If the client connects using a protocol that only supports one-way communication from the server (like standard SSE), the `incomingMessages` parameter will be null. Your `connect` method should handle this by only returning the subscription or yielding messages.

## Using WebSockets from the Client

You can connect to your real-time resource using a standard WebSocket client.

```javascript
const socket = new WebSocket('ws://your-harper-instance/ExampleSocket');

socket.onmessage = (event) => {
	const data = JSON.parse(event.data);
	console.log('Real-time update:', data);
};

socket.send(JSON.stringify({ type: 'ping' }));
```

## Key Real-time Features

- **Automatic Table Subscriptions**: Easily stream changes from any database table.
- **Bi-directional Communication**: Send and receive messages in real-time.
- **Scalable Pub/Sub**: Harper handles the efficient distribution of messages to subscribers.
