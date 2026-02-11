# Checking Authentication and Sessions in this app (HarperDB Resources)

This project uses HarperDB Resource classes with cookie-backed sessions to enforce authentication and authorization. Below are the concrete patterns used across resources like `resources/me.ts`, `resources/signIn.ts`, `resources/signOut.ts`, and protected endpoints such as `resources/downloadAlbumArtwork.ts`.

Important: To actually enforce sessions (even on localhost), HarperDB must not auto-authorize the local loopback as the superuser. Ensure the following in your HarperDB config (see `~/hdb/harperdb-config.yaml`):

```yaml
authentication:
  authorizeLocal: false
  enableSessions: true
```

With `authorizeLocal: true`, all local requests would be auto-authorized as the superuser, bypassing these checks. We keep it off to ensure session checks are respected.

## Public vs protected routes

- Public resources explicitly allow the method via `allowRead()` or `allowCreate()` or similara returning `true`.
- Protected handlers perform checks up-front using the current session user (and, for privileged actions, a helper like `ensureSuperUser`).

## Creating a session (sign in)

Pattern from `resources/signIn.ts`:

```ts
import { type Context, type RequestTargetOrId, Resource } from 'harperdb';

export interface LoginBody {
	username?: string;
	password?: string;
}

export class SignIn extends Resource {
	static loadAsInstance = false;

	allowCreate() {
		return true; // public endpoint
	}

	async post(_target: RequestTargetOrId, data: LoginBody) {
		const errors: string[] = [];
		if (!data.username) { errors.push('username'); }
		if (!data.password) { errors.push('password'); }
		if (errors.length) {
			return new Response(
				`Please include the ${errors.join(' and ')} in your request.`,
				{ status: 400 },
			);
		}

		const context = this.getContext() as Context as any;
		try {
			await context.login(data.username, data.password);
		} catch {
			return new Response('Please check your credentials and try again.', {
				status: 403,
			});
		}
		return new Response('Welcome back!', { status: 200 });
	}
}
```

- `context.login(username, password)` creates a session and sets the session cookie on the response.
- Missing fields → `400 Bad Request`.
- Invalid credentials → `403 Forbidden` (don’t leak which field was wrong).

## Reading the current user (who am I)

Pattern from `resources/me.ts`:

```ts
import { Resource } from 'harperdb';

export class Me extends Resource {
	static loadAsInstance = false;

	allowRead() {
		return true; // public: returns data only if session exists
	}

	async get() {
		const user = this.getCurrentUser?.();
		if (!user?.username) {
			// Not signed in; return 200 with no body to make polling simple on the client
			return new Response(null, { status: 200 });
		}
		return {
			active: user.active,
			role: user.role,
			username: user.username,
			created: user.__createdtime__,
			updated: user.__updatedtime__,
		};
	}
}
```

- Use `this.getCurrentUser?.()` to access the session’s user (if any).
- It may be `undefined` when unauthenticated. Handle that case explicitly.

## Destroying a session (sign out)

Pattern from `resources/signOut.ts`:

```ts
import { type Context, Resource } from 'harperdb';

export class SignOut extends Resource {
	static loadAsInstance = false;

	allowCreate() {
		return true; // public endpoint, but requires a session to actually act
	}

	async post() {
		const user = this.getCurrentUser();
		if (!user?.username) {
			return new Response('Not signed in.', { status: 401 });
		}

		const context = this.getContext() as Context as any;
		await context.session?.delete?.(context.session.id);
		return new Response('Signed out successfully.', { status: 200 });
	}
}
```

- If the request has no session, return `401 Unauthorized`.
- Otherwise delete the current session via `context.session.delete(sessionId)`.

## Protecting privileged endpoints

For admin-only or otherwise privileged actions, use the `ensureSuperUser` helper with the current user.

```ts
import {
	RequestTarget,
	type RequestTargetOrId,
	Resource,
	tables,
} from 'harperdb';
import { ensureSuperUser } from './common/ensureSuperUser.ts';

export class DoSomethingInteresting extends Resource {
	static loadAsInstance = false;

	async get(target: RequestTargetOrId) {
		ensureSuperUser(this.getCurrentUser());
		// … fetch and return the artwork
	}
}
```

`ensureSuperUser` throws a `403` if the user is not a super user:

```ts
import { type User } from 'harperdb';

export function ensureSuperUser(user: User | undefined) {
	if (!user?.role?.permission?.super_user) {
		let error = new Error('You do not have permission to perform this action.');
		(error as any).statusCode = 403;
		throw error;
	}
}
```

## Status code conventions used here

- 200: Successful operation. For `GET /me`, a `200` with empty body means “not signed in”.
- 400: Missing required fields (e.g., username/password on sign-in).
- 401: No current session for an action that requires one (e.g., sign out when not signed in).
- 403: Authenticated but not authorized (bad credentials on login attempt, or insufficient privileges).

## Client considerations

- Sessions are cookie-based; the server handles setting and reading the cookie via HarperDB. If you make cross-origin requests, ensure the appropriate `credentials` mode and CORS settings.
- If developing locally, double-check the server config still has `authentication.authorizeLocal: false` to avoid accidental superuser bypass.

## Token-based auth (JWT + refresh token) for non-browser clients

Cookie-backed sessions are great for browser flows. For CLI tools, mobile apps, or other non-browser clients, it’s often easier to use **explicit tokens**:

- **JWT (`operation_token`)**: short-lived bearer token used to authorize API requests.
- **Refresh token (`refresh_token`)**: longer-lived token used to mint a new JWT when it expires.

This project includes two Resource patterns for that flow:

### Issuing tokens: `IssueTokens`

**Description / use case:** Generate `{ refreshToken, jwt }` either:
-  with an existing Authorization token (either Basic Auth or a JWT) and you want to issue new tokens, or
- from an explicit `{ username, password }` payload (useful for direct “login” from a CLI/mobile client).
```
js
export class IssueTokens extends Resource {
static loadAsInstance = false;

	async get(target) {
		const { refresh_token: refreshToken, operation_token: jwt } =
			await databases.system.hdb_user.operation(
				{ operation: 'create_authentication_tokens' },
				this.getContext(),
			);
		return { refreshToken, jwt };
	}

	async post(target, data) {
		if (!data.username || !data.password) {
			throw new Error('username and password are required');
		}

		const { refresh_token: refreshToken, operation_token: jwt } =
			await databases.system.hdb_user.operation({
				operation: 'create_authentication_tokens',
				username: data.username,
				password: data.password,
			});
		return { refreshToken, jwt };
	}
}
```
**Recommended documentation notes to include:**
- `GET` variant: intended for “I already have an Authorization token, give me new tokens”.
- `POST` variant: intended for “I have credentials, give me tokens”.
- Response shape:
    - `refreshToken`: store securely (long-lived).
    - `jwt`: attach to requests (short-lived).

### Refreshing a JWT: `RefreshJWT`

**Description / use case:** When the JWT expires, the client uses the refresh token to get a new JWT without re-supplying username/password.
```
js
export class RefreshJWT extends Resource {
static loadAsInstance = false;

	async post(target, data) {
		if (!data.refreshToken) {
			throw new Error('refreshToken is required');
		}

		const { operation_token: jwt } = await databases.system.hdb_user.operation({
			operation: 'refresh_operation_token',
			refresh_token: data.refreshToken,
		});
		return { jwt };
	}
}
```
**Recommended documentation notes to include:**
- Requires `refreshToken` in the request body.
- Returns a new `{ jwt }`.
- If refresh fails (expired/revoked), client must re-authenticate (e.g., call `IssueTokens.post` again).

### Suggested client flow (high-level)

1. **Sign in (token flow)**
    - POST /IssueTokens/ with a body of `{ "username": "your username", "password": "your password" }` or GET /IssueTokens/ with an existing Authorization token.
    - Receive `{ jwt, refreshToken }` in the response
2. **Call protected APIs**
    - Send the JWT with each request in the Authorization header (as your auth mechanism expects)
3. **JWT expires**
    - POST /RefreshJWT/ with a body of `{ "refreshToken": "your refresh token" }`.
    - Receive `{ jwt }` in the response and continue
## Quick checklist

- [ ] Public endpoints explicitly `allowRead`/`allowCreate` as needed.
- [ ] Sign-in uses `context.login` and handles 400/403 correctly.
- [ ] Protected routes call `ensureSuperUser(this.getCurrentUser())` (or another role check) before doing work.
- [ ] Sign-out verifies a session and deletes it.
- [ ] `authentication.authorizeLocal` is `false` and `enableSessions` is `true` in HarperDB config.
- [ ] If using tokens: `IssueTokens` issues `{ jwt, refreshToken }`, `RefreshJWT` refreshes `{ jwt }` with a `refreshToken`.
