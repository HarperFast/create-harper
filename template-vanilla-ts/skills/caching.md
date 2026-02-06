# Harper Caching

Harper includes integrated support for **caching data from external sources**, enabling high-performance, low-latency cache storage that is fully queryable and interoperable with your applications. With built-in caching capabilities and distributed responsiveness, Harper makes an ideal **data caching server** for both edge and centralized use cases.

---

## What is Harper Caching?

Harper caching lets you store **cached content** in standard tables, enabling you to:

- Expose cached entries as **queryable structured data** (e.g., JSON or CSV)
- Serve data to clients with **flexible formats and custom querying**
- Manage cache control with **timestamps and ETags** for downstream caching layers
- Implement **active or passive caching** patterns depending on your source and invalidation strategy

---

## Configuring a Cache Table

Define a cache table in your `schema.graphql`:

```graphql
type MyCache @table(expiration: 3600) @export {
  id: ID @primaryKey
}
```

- `expiration` is defined in seconds
- Expired records are refreshed on access
- Evicted records are removed after expiration

---

## Connecting an External Source

Create a resource:

```js
import { Resource } from "harperdb"

export class ThirdPartyAPI extends Resource {
	async get() {
		const id = this.getId()
		const response = await fetch(`https://api.example.com/items/${id}`)
		if (!response.ok) {
			throw new Error("Source fetch failed")
		}
		return await response.json()
	}
}
```

Attach it to your table:

```js
import { tables } from "harperdb"
import { ThirdPartyAPI } from "./ThirdPartyAPI.js"

const { MyCache } = tables
MyCache.sourcedFrom(ThirdPartyAPI)
```

---

## Cache Behavior

1. Fresh data is returned immediately  
2. Missing or stale data triggers a fetch  
3. Concurrent misses are deduplicated  

---

## Active Caching

Use `subscribe()` to proactively update or invalidate cache entries:

```js
class MyAPI extends Resource {
  async *subscribe() {
    // stream updates
  }
}
```

---

## Write-Through Caching

Propagate updates upstream:

```js
class ThirdPartyAPI extends Resource {
  async put(data) {
    await fetch(`https://some-api.com/${this.getId()}`, {
      method: "PUT",
      body: JSON.stringify(data)
    })
  }
}
```

---

## Summary

Harper Caching allows you to:

- Cache external APIs efficiently
- Query cached data like native tables
- Prevent cache stampedes
- Build real-time or write-through caches
