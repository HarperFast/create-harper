# Vector Indexing

Harper supports **vector indexing** on array attributes, enabling efficient similarity search over high-dimensional vector data. This is essential for AI-powered features such as semantic search, recommendations, and embeddings-based retrieval.

---

## What Is Vector Indexing

Vector indexing organizes numeric vectors so that Harper can efficiently find records that are closest to a given query vector using a distance metric such as cosine similarity or Euclidean distance.

Unlike traditional indexes that rely on exact matches, vector indexes enable **nearest-neighbor search** across high-dimensional spaces, making them ideal for embeddings and machine learning workloads.

---

## Enabling a Vector Index

Vector indexes are defined using the `@indexed` directive on numeric array attributes.

```graphql
type Product @table {
  id: Long @primaryKey
  textEmbeddings: [Float] @indexed(type: "HNSW")
}
```

- `type: "HNSW"` enables Harper’s vector index using the HNSW algorithm
- The indexed field must be an array of numeric values
- Vector indexes are stored and maintained automatically

---

## Querying with a Vector Index

Once defined, vector indexes can be used by specifying a `sort` configuration with a target vector.

```js
const results = Product.search({
  sort: {
    attribute: "textEmbeddings",
    target: searchVector
  },
  limit: 5
})
```

- `searchVector` is the embedding to compare against
- Results are ordered by similarity
- Vector search can be combined with filters and limits

---

## Vector Index Options

Additional tuning options can be provided on the `@indexed` directive:

| Option | Description |
|------|-------------|
| `distance` | Similarity metric (`cosine` or `euclidean`) |
| `efConstruction` | Index build quality vs performance |
| `M` | Graph connectivity per HNSW layer |
| `optimizeRouting` | Improves routing efficiency |
| `efSearchConstruction` | Search breadth during queries |

These options allow fine-tuning for performance and recall tradeoffs.

---

## When to Use Vector Indexing

Vector indexing is ideal when:

- Storing embedding vectors from ML models
- Performing semantic or similarity-based search
- Working with high-dimensional numeric data
- Exact-match indexes are insufficient

---

## Summary

- Vector indexing enables fast similarity search on numeric arrays
- Defined using `@indexed(type: "HNSW")`
- Queried using a target vector in search sorting
- Tunable for performance and accuracy
