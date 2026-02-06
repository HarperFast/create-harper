# JWT Authentication

Harper uses **token-based authentication** with **JSON Web Tokens (JWTs)** to secure API and operations requests. JWT authentication enables long-lived sessions and token refresh without repeatedly sending Basic authentication credentials.

---

## Overview

Harper JWT authentication uses two token types:

- **operation_token**  
  Used to authenticate Harper operations via the `Authorization: Bearer` header.  
  Default expiration: **1 day**

- **refresh_token**  
  Used only to generate a new `operation_token` using the refresh operation.  
  Default expiration: **30 days**

If both tokens expire or are lost, new tokens can be generated using credentials.

---

## Creating Authentication Tokens

To generate JWT tokens, call the operations API with a username and password. This request does not require authentication.

```json
{
  "operation": "create_authentication_tokens",
  "username": "username",
  "password": "password"
}
```

### cURL Example

```bash
curl --request POST http://localhost:9925   --header "Content-Type: application/json"   --data '{
    "operation": "create_authentication_tokens",
    "username": "username",
    "password": "password"
  }'
```

### Response

```json
{
  "operation_token": "<JWT_OPERATION_TOKEN>",
  "refresh_token": "<JWT_REFRESH_TOKEN>"
}
```

---

## Using JWT Authentication

Once generated, include the `operation_token` in the `Authorization` header for all authenticated requests:

Sample operation API request with JWT authentication:

```bash
curl --request POST http://localhost:9925   --header "Content-Type: application/json"   --header "Authorization: Bearer <JWT_OPERATION_TOKEN>"   --data '{
    "operation": "search_by_hash",
    "schema": "dev",
    "table": "dog",
    "hash_values": [1],
    "get_attributes": ["*"]
  }'
```

Sample REST request with JWT authentication:
```bash
curl --request GET http://localhost:9925/products/1 --header "Content-Type: application/json" --header "Authorization: Bearer <JWT_OPERATION_TOKEN>"
```
JWT authentication replaces Basic authentication for standard API operations and REST requests.

---

## Refreshing Tokens

When an `operation_token` expires, use the `refresh_token` to generate a new one:

```bash
curl --request POST http://localhost:9925   --header "Content-Type: application/json"   --header "Authorization: Bearer <JWT_REFRESH_TOKEN>"   --data '{
    "operation": "refresh_operation_token"
  }'
```

This returns a new `operation_token` that can be used for subsequent requests.

---

## Configuration

JWT expiration values can be configured in `harperdb-config.yaml`:

| Setting | Description | Default |
|-------|------------|---------|
| operationsApi.authentication.operationTokenTimeout | Operation token lifetime | 1 day |
| operationsApi.authentication.refreshTokenTimeout | Refresh token lifetime | 30 days |

Adjust these values to match your security requirements.

---

## RBAC and JWT Authentication

Harper Role-Based Access Control (RBAC) is **applied at request time** for all JWT-authenticated operations.

- JWTs authenticate **which user** is making the request
- RBAC determines **what that user is allowed to do**
- Permissions are resolved dynamically and are **not encoded in the token**

As a result:
- Role or permission changes take effect **immediately**
- JWTs do **not** need to be reissued when RBAC changes
- Authentication (JWT) and authorization (RBAC) remain cleanly separated

---

## Summary

- JWT authentication secures Harper operations using bearer tokens
- Operation tokens authenticate requests
- Refresh tokens renew expired operation tokens
- Token lifetimes are configurable
