# Checking Authentication in HarperDB

Custom resources and table resource overrides often need to restrict access based on the current user's identity or role. HarperDB provides the `this.getCurrentUser()` method within resource classes to access information about the authenticated user making the request.

## Using `this.getCurrentUser()`

The `this.getCurrentUser()` method returns an object containing details about the authenticated user, such as their username and role. If the request is unauthenticated, it may return `null` or `undefined`.

### Example: Role-Based Access Control

You can check the user's role to determine if they have permission to perform a specific action.

```typescript
import { RequestTargetOrId, Resource } from 'harperdb';

export class MyResource extends Resource {
	async post(target: RequestTargetOrId, record: any) {
		const user = this.getCurrentUser();

		// Check if the user has the 'super_user' role
		if (user?.role?.role !== 'super_user') {
			throw {
				message: 'Only super users are allowed to make changes',
				statusCode: 403,
			};
		}

		return super.post(target, record);
	}
}
```

## Handling Unauthenticated Requests

Always ensure you handle cases where `this.getCurrentUser()` returns `null`, especially if your resource is accessible to unauthenticated users.

```typescript
const user = this.getCurrentUser();
if (!user) {
	throw {
		message: 'Authentication required',
		statusCode: 401,
	};
}
```

## User Object Structure

The object returned by `this.getCurrentUser()` typically includes:

- `username`: The username of the authenticated user.
- `role`: An object containing role information, including the `role` name itself (e.g., `user.role.role`).
