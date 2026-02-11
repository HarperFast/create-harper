# Handling Binary Data in Harper

When working with binary data (such as images or audio files) in Harper, you often receive this data as base64-encoded strings through JSON REST APIs. To store this data efficiently in a `Blob` field, you should convert it to a `Buffer`.

## Storing Base64 Strings as Buffers

In a custom resource or a table resource override, you can intercept the incoming record and convert base64 strings to buffers before saving them to the database.

### Example

Suppose you have a table with a `Blob` field named `data`. You can use `Buffer.from(string, 'base64')` to perform the conversion to a buffer, and then use Harper's `createBlob` function to turn that buffer into a blob with a type such as `{ type: 'image/jpeg' }`.

```typescript
import { RequestTargetOrId, Resource } from 'harperdb';

export class MyResource extends Resource {
	async post(target: RequestTargetOrId, record: any) {
		if (record.data) {
			// Convert base64-encoded string to a Buffer
			record.data = createBlob(Buffer.from(record.artwork, 'base64'), {
				type: 'image/jpeg',
			});
		}
		// Call the super method to perform the actual storage
		return super.post(target, record);
	}
}
```

## Responding with Binary Data

When you want to serve binary data (like an image or an MP3 file) back to the client, you can return a response object from your resource's `get` method. This object should include the appropriate `status`, `headers`, and the binary data itself in the `body`.

### Example: Responding with a JPEG File

In this example, we retrieve a thumbnail from the database. If it contains binary data in the `data` field, we return it with the `image/jpeg` content type.

```typescript
import { RequestTarget, RequestTargetOrId, Resource } from 'harperdb';

export class TrackResource extends Resource {
	async get(target: RequestTargetOrId) {
		const id = (target as RequestTarget)?.id;
		if (!id) {
			return super.get(target);
		}
		const thumbnail = await super.get(target);
		if (thumbnail?.data) {
			return {
				status: 200,
				headers: {
					'Content-Type': 'image/jpeg',
					'Content-Disposition': `inline; filename="${thumbnail.name}.jpg"`,
				},
				body: thumbnail.data,
			};
		}
		return thumbnail;
	}
}
```

## Why Use Blobs?

- **Efficiency**: `Blob` fields are optimized for storing binary data. Buffers are the standard way to handle binary data in Node.js.
- **Compatibility**: Many Harper features and external libraries expect binary data to be in `Buffer` or `Uint8Array` format.
- **Storage**: Storing data as binary is more compact than storing it as a base64-encoded string.
