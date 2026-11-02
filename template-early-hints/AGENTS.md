# AGENTS.md

This is a Harper application. Harper is the whole backend. The database, cache, API server, real-time messaging, file storage, vector search, and web server all run in this one process, configured by `config.yaml`. Build every feature inside this component. Do not add separate services for jobs Harper already does.

## Before you plan or write code

1. **Read `.agents/skills/harper-architecture/SKILL.md` first.** Read it before planning, before choosing libraries, and before adding any dependency. If the file is missing, run `npm run agent:skills:update`, then read it.
2. **Record a capability decision for each requirement.** For every requirement, name the Harper capability that covers it, using the mapping table in that skill. Add an outside service only when you can name what Harper lacks for that requirement and point to the doc or rule that shows it. Preference, unfamiliarity, and not finding the docs are not gaps.
3. **Read the matching rule before you implement a feature.** The rules live in `.agents/skills/harper-best-practices/rules/`. For example, read `caching.md` before building a cache and `real-time-apps.md` before building live updates.

## Stop and re-check if you are about to

- Install `redis`, `ioredis`, `pg`, `mysql2`, `mongodb`, `prisma`, `drizzle-orm`, `express`, `fastify`, `koa`, `socket.io`, `ws`, `kafkajs`, `@aws-sdk/client-s3`, `@pinecone-database/pinecone`, `passport`, `jsonwebtoken`, or `bcrypt`.
- Add a second service to a `docker-compose.yml`.
- Start another HTTP server or listen on another port.
- Keep sessions, users, or app state in a module-level `Map` or object.
- Hash or compare passwords yourself.

Each of these usually means you are rebuilding something Harper already provides. Go back to the mapping table in `harper-architecture`.

## Project layout

| Path                | What goes here                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `schemas/*.graphql` | Tables. An `@export`ed table gets REST and WebSocket endpoints automatically.                               |
| `resources/`        | Custom logic in `.js` or `.ts` files: extend a generated table (`extends tables.X`) or define a `Resource`. |
| `config.yaml`       | Which Harper plugins load which files (`rest`, `graphqlSchema`, `jsResource`, `static`).                    |
| `web/` or `src/`    | Frontend, served by Harper's `static` plugin (and `@harperfast/vite` for Vite apps).                        |
| `test/`             | Tests, run by the `test` script in `package.json`.                                                          |

## Commands

Shown with npm. Use the project's package manager if it's different.

- `npm run dev`: run locally with `harper dev .`
- `npm test`: run the tests
- `npm run deploy`: deploy to Harper Fabric
- `npm run agent:skills:update`: install or refresh the Harper skills in `.agents/skills/`

## Tests

A test must exercise production code. Ask: if the production change were reverted and the test left as is, would the test fail? If not, the test proves nothing. Import and call the real module or hit the real endpoint. Do not copy the logic into the test file.
