# Blob (Binary Large Objects)

Harper supports **Blobs** — binary large objects for storing unstructured or large binary data — with integrated streaming support and efficient storage. Blobs are ideal for media files, documents, and any data where size or throughput makes standard JSON fields impractical.

---

## What Are Blobs

Blobs extend the native JavaScript `Blob` type and allow you to store **binary or arbitrary data** inside Harper tables. The blob reference is stored in the record, while the blob’s contents are streamed to and from storage.

- Designed for binary data such as images, audio, and documents
- Supports streaming reads and writes
- Blob data is stored separately from record attributes
- Optimized for large payloads

---

## Defining Blob Fields

Declare a blob field using the `Blob` type in your schema:

```graphql
type MyTable @table {
  id: ID @primaryKey
  data: Blob
}
```

Any record written to this field will store a reference to the blob’s contents.

---

## Creating and Storing Blobs

### Creating a Blob from a Buffer

```js
const blob = createBlob(largeBuffer)
await MyTable.put({ id: "my-record", data: blob })
```

- `createBlob()` returns a blob reference
- Data is streamed to storage asynchronously
- Records may be committed before the blob finishes writing

---

### Creating a Blob from a Stream

```js
const blob = createBlob(stream)
await MyTable.put({ id: "streamed-record", data: blob })
```

Streaming allows large data to be written without loading it fully into memory.

---

## Reading Blob Data

Retrieve a record and read its blob contents:

```js
const record = await MyTable.get("my-record")
const buffer = await record.data.bytes()
```

Blob objects also support streaming interfaces for large reads.

---

## Blob Attributes and Events

### Size

The blob size may not be immediately available when streaming:

```js
if (blob.size === undefined) {
	blob.on("size", size => {
		console.log("Blob size:", size)
	})
}
```

---

### saveBeforeCommit

Blobs are not atomic while streaming. To ensure the blob is fully written before committing the record:

```js
const blob = createBlob(stream, { saveBeforeCommit: true })
await MyTable.put({ id: "safe-record", data: blob })
```

---

## Error Handling

Handle streaming errors by attaching an error listener:

```js
blob.on("error", () => {
	MyTable.invalidate("my-record")
})
```

This prevents partially written blobs from being used.

---

## Automatic Coercion

When a field is defined as `Blob`, assigning a string or buffer automatically converts it into a blob when using `put`, `patch`, or `publish`.

---

## Related Skill

- [Handling Binary Data with Blobs](handling-binary-data.md) How to store and serve binary data like images or MP3s using the Blob data type.

---

## Summary

- Blobs store large or binary data efficiently
- Blob fields reference streamed content
- Supports buffered and streamed writes
- Optional write-before-commit behavior
- Integrates seamlessly with Harper tables
