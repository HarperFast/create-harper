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
  name: String
  description: String
  textEmbeddings: [Float] @indexed(type: "HNSW")
  price: Float
}
```

- `type: "HNSW"` enables Harper’s vector index using the HNSW algorithm
- The indexed field must be an array of numeric values
- Vector indexes are stored and maintained automatically

---

## Querying with a Vector Index

### Search Vectors with sort

Once defined, vector indexes can be used by specifying a `sort` configuration with a target vector. To view the similarity of a result to a given query vector, use the `$distance` attribute in the `select` clause.

```js
const results = Product.search({
  select: ['name', 'description', 'price', '$distance'],
  sort: {
    attribute: 'textEmbeddings',
    target: searchVector
  },
  limit: 5
})
```

- `attribute` is the vector index attribute
- `target` is the vector to compare against
- `searchVector` is the embedding to compare against
- Results are ordered by similarity
- Vector search can be combined with filters and limits
- The `$distance` attribute in the `select` (optional) returns the distance between the result and the query vector

### Search Vectors limited by distance

Vector indexes results can be limited by distance using the `conditions` clause. In the following example, results are returned that are less than 0.1 similar to the query vector.
The `conditions` clause can be combined with `sort` and `limit` and the `comparator` can be any of the following: `lt`, `lte`, `gt`, `gte`, `between`.

```js
const results = Product.search({
  select: ['name', 'description', 'price', '$distance'],
  conditions: { 
    attribute: 'textEmbeddings',
    comparator: 'lt',
    value: 0.1, // '0.1' is the similarity threshold
    target: searchVector,
  }
})
```

- `attribute` is the vector index attribute
- `comparator` is the comparison operator (`lt`, `lte`, `gt`, `gte`, `between` are accepted)
- `value` is the threshold value
- `target` is the vector to compare against
- `searchVector` is the embedding to compare against
- Vector search can be combined with filters, sort, and limits
- The `$distance` attribute in the `select` (optional) returns the distance between the result and the query vector

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

## How to Generate and Search Vector Embeddings

Here is a full example that generates embeddings for a set of products and then searches for similar products using vector indexes. The following example shows how to generate embeddings using OpenAI or Ollama.

```js
import { Ollama } from 'ollama';
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
// The name of the ollama embedding model
const OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';

const { Product } = tables;

import OpenAI from 'openai';
const openai = new OpenAI();
// the name of the OpenAI embedding model
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

const SIMILARITY_THRESHOLD = 0.5;

export class ProductSearch extends Resource {
	//based on env variable we choose the appropriate embedding generator
	generateEmbedding = process.env.EMBEDDING_GENERATOR === 'ollama' ? this._generateOllamaEmbedding : this._generateOpenAIEmbedding;

	/**
	 * Executes a search query using a generated text embedding and returns the matching products.
	 *
	 * @param {Object} data - The input data for the request.
	 * @param {string} data.prompt - The prompt to generate the text embedding from.
	 * @return {Promise<Array>} Returns a promise that resolves to an array of products matching the conditions,
	 * including fields: name, description, price, and $distance.
	 */
	async post(data) {
		const embedding = await this.generateEmbedding(data.prompt);

		return await Product.search({
			select: ['name', 'description', 'price', '$distance'],
			conditions: {
				attribute: 'textEmbeddings',
				comparator: 'lt',
				value: SIMILARITY_THRESHOLD,
				target: embedding[0],
			},
			limit: 5,
		});
	}

	/**
	 * Generates an embedding using the Ollama API.
	 *
	 * @param {string} promptData - The input data for which the embedding is to be generated.
	 * @return {Promise<number[][]>} A promise that resolves to the generated embedding as an array of numbers.
	 */
	async _generateOllamaEmbedding(promptData) {
		const embedding = await ollama.embed({
			model: OLLAMA_EMBEDDING_MODEL,
			input: promptData,
		});
		return embedding?.embeddings;
	}

	/**
	 * Generates OpenAI embeddings based on the given prompt data.
	 *
	 * @param {string} promptData - The input data used for generating the embedding.
	 * @return {Promise<number[][]>} A promise that resolves to an array of embeddings, where each embedding is an array of floats.
	 */
	async _generateOpenAIEmbedding(promptData) {
		const embedding = await openai.embeddings.create({
			model: OPENAI_EMBEDDING_MODEL,
			input: promptData,
			encoding_format: 'float',
		});

		let embeddings = [];
		embedding.data.forEach((embeddingData) => {
			embeddings.push(embeddingData.embedding);
		});

		return embeddings;
	}
}
```

Sample request to the `ProductSearch` resource which prompts to find "shorts for the gym":
```bash    
curl -X POST "http://localhost:9926/ProductSearch/" \
-H "accept: \
-H "Content-Type: application/json" \
-H "Authorization: Basic <YOUR_AUTH>" \
-d '{"prompt": "shorts for the gym"}'
```

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
