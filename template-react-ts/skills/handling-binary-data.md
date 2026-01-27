# Handling Binary Data in HarperDB

When working with binary data (such as images or audio files) in HarperDB, you often receive this data as base64-encoded strings through JSON REST APIs. To store this data efficiently in a `Blob` field, you should convert it to a `Buffer`.

## Storing Base64 Strings as Buffers

In a custom resource or a table resource override, you can intercept the incoming record and convert base64 strings to buffers before saving them to the database.

### Example

Suppose you have a table with a `Blob` field named `data`. You can use `Buffer.from(string, 'base64')` to perform the conversion.

```typescript
import { RequestTargetOrId, Resource } from 'harperdb';

export class MyResource extends Resource {
	async post(target: RequestTargetOrId, record: any) {
		if (record.data) {
			// Convert base64-encoded string to a Buffer
			record.data = Buffer.from(record.data, 'base64');
		}
		// Call the super method to perform the actual storage
		return super.post(target, record);
	}
}
```

## Responding with Binary Data

When you want to serve binary data (like an image or an MP3 file) back to the client, you can return a response object from your resource's `get` method. This object should include the appropriate `status`, `headers`, and the binary data itself in the `body`.

### Example: Streaming an MP3 File

In this example, we retrieve a track from the database. If it contains binary data in the `data` field, we return it with the `audio/mpeg` content type.

```typescript
import { RequestTarget, RequestTargetOrId, Resource } from 'harperdb';

export class TrackResource extends Resource {
	async get(target: RequestTargetOrId) {
		const id = (target as RequestTarget)?.id;
		if (!id) {
			return super.get(target);
		}
		const track = await super.get(target) as any;
		if (track?.data) {
			return {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Disposition': `inline; filename="${track.name}.mp3"`,
				},
				body: track.data,
			};
		}
		return track;
	}
}
```

## Why Use Buffers?

- **Efficiency**: `Blob` fields are optimized for storing binary data. Buffers are the standard way to handle binary data in Node.js.
- **Compatibility**: Many HarperDB features and external libraries expect binary data to be in `Buffer` or `Uint8Array` format.
- **Storage**: Storing data as binary is more compact than storing it as a base64-encoded string.
