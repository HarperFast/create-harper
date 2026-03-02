# your-project-name-here

Your new component is focused on delivering **Early Hints** for key assets including:

- Main product images
- JS, CSS, and Font file dependencies
- CDN domains to preconnect

The component exposes a **single API endpoint** that accepts a page URL and returns the relevant early hints for that page, including CSS/JS and image assets.

Here's what you should do next:

## Installation

To get started, make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper):

```sh
npm install -g harperdb
```

## Development

Then you can start your app:

```sh
npm run dev
```

TypeScript is supported at runtime in Node.js through [type stripping](https://nodejs.org/api/typescript.html#type-stripping). Full TypeScript language support can be enabled through integrating third party build steps to transpile your TypeScript into JavaScript.

## Usage

### Endpoints

| Endpoint        | Description                                                     | Query Parameters                    |
| --------------- | --------------------------------------------------------------- | ----------------------------------- |
| `/hints`        | Supports GET request to return early hints for a given page URL | `q` = full URL of the page          |
|                 |                                                                 | `w` = device width                  |
|                 |                                                                 | `s` = '1' for Safari browser or '0' |
|                 |                                                                 | `v` = hints version                 |
| `/site-images/` | Direct REST interface for the SiteImages table                  |                                     |

The Harper REST API gives low level control over your data. For a full description of what the REST API can do and how to use if your can refer to its [documentation](https://docs.harperdb.io/docs/developers/rest).
This REST interface for the various tables can be used to manually manipulate the data. See the [Data Model](#data-model) section below for details on the structure of each table.

### Example Request

```http
GET /hints?s=1&w=1280&v=1&q=https://www.harper.fast/company
```

### Example Response

```json
"<https://cdn.prod.website-files.com/68bb0738eb2e6c6ef63de53a/68e57930a38950b0239b5c79_Company%20Hero.png;rel=preload;as=image;crossorigin>"
```

## Data Model

### SiteImages Table

| Name           | Type                       | Description                                           |
| -------------- | -------------------------- | ----------------------------------------------------- |
| `cacheKey`     | [String] **(Primary Key)** | Unique identifier of hintsVersion and pageUrl         |
| `pageUrl`      | [String] (indexed)         | Website page URL                                      |
| `hintsVersion` | [Int] (indexed)            | Hints version (default is 1)                          |
| `hints`        | [String]                   | Array of product image urls to be sent as early hints |

## Edgeworker

The **edgeworker** acts as a forwarder for hint generation. It takes the client's original URL request and sends it to Harper via GTM to the `/hints` endpoint. The response from Harper (an array of hint strings) is then used to set the `PMUSER_103_HINTS` variable.

This variable is interpreted by the CDN edge layer to emit a `103 Early Hints` response, allowing browsers to start fetching assets before the main HTML payload arrives.

The variable has a max character length of 1024. Exceeding this limit will result in the edgeworker returning an error.

## Deployment

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Make sure you've configured your [.env](./.env) file with your secure cluster credentials. Don't commit this file to source control!

Then you can deploy your component to your cluster:

```sh
npm run deploy
```

## Keep Going!

For more information about getting started with Harper and building applications, see our [getting started guide](https://docs.harperdb.io/docs).

For more information on Harper Components, see the [Components documentation](https://docs.harperdb.io/docs/reference/components).
