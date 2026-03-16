# Error Handling

> How errors are handled in this project.

---

## Overview

This codebase has two distinct error contracts:

- legacy internal routes (`/api/*`, `/admin/*`, `/user_api/*`, `/telegram/*`) mostly return `c.text(...)` on failure and `c.json(...)` on success
- the external API under `/v1/*` returns a structured JSON error envelope with `error.code`, `error.message`, and `error.request_id`

Top-level uncaught errors fall through `worker/src/worker.ts`:

```ts
app.onError((err, c) => {
  console.error(err)
  return c.text(`${err.name} ${err.message}`, 500)
})
```

Do not assume a single project-wide response format.

---

## Error Types

There is no custom error class hierarchy today. Most handlers use:

- plain `Error`
- string checks against error messages when compatibility fallbacks are needed
- localized message strings from worker i18n

Examples:

- `worker/src/common.ts` throws `Error` for address creation and cleanup failures
- `worker/src/mails_api/index.ts` converts validation failures into localized `c.text(..., status)`
- `worker/src/open_api/index.ts` uses `jsonError(...)` instead of throwing response objects

---

## Error Handling Patterns

Current patterns:

- validate early and return a response immediately
- use `try/catch` around DB or external-service operations that need message translation
- log caught exceptions before returning a degraded or user-facing error
- keep the route contract stable for the caller instead of mixing formats arbitrarily

Examples:

- `worker/src/mails_api/index.ts`
- `worker/src/admin_api/index.ts`
- `worker/src/open_api/index.ts`

When extending an existing route family, match that family's current contract instead of inventing a new one.

---

## Scenario: Legacy Routes Vs `/v1` External API

### 1. Scope / Trigger

- Trigger: add or change any endpoint consumed by the Vue frontend.
- Trigger: add or change any `/v1/*` endpoint consumed by external clients.
- Trigger: change auth, pagination, or idempotency behavior.

### 2. Signatures

- Legacy internal routes:
  - success: usually `c.json(...)`
  - failure: usually `c.text(message, status)`
- External API routes:
  - success: `c.json(payload, status?)`
  - failure: `jsonError(c, status, code, message)`
  - headers: `x-request-id`, `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`

### 3. Contracts

- Frontend `frontend/src/api/index.js` expects non-2xx legacy responses to be plain text or another directly stringifiable body.
- `/v1/*` consumers expect:

```json
{
  "error": {
    "code": "invalid_limit",
    "message": "limit must be an integer between 1 and 100",
    "request_id": "..."
  }
}
```

- `Idempotency-Key` is only part of the `/v1/addresses` create flow.
- Auth headers differ by route family:
  - `Authorization: Bearer ...` for address JWT legacy flows
  - `x-user-token` / `x-user-access-token` for user flows
  - `x-admin-auth` for admin password mode
  - `x-api-key` for `/v1/*`

### 4. Validation & Error Matrix

| Route family | Failure case | Response |
|--------------|--------------|----------|
| `/api/*` | invalid address JWT | `401` text |
| `/admin/*` | missing admin access | `401` text |
| `/user_api/*` | expired user token | `401` text |
| `/v1/*` | missing API key | `401` JSON error envelope |
| `/v1/*` | invalid pagination | `400` JSON error envelope |
| `/v1/addresses` | idempotency mismatch | `409` JSON error envelope |

### 5. Good / Base / Bad Cases

- Good: new `/v1/*` route reuses `jsonError()` and emits `x-request-id`.
- Base: legacy route returns localized `c.text(msgs.OperationFailedMsg, 500)`.
- Bad: new legacy route returns a random JSON error shape that `frontend/src/api/index.js` does not expect.

### 6. Tests Required

- Call the changed route once with a valid request and once with a representative invalid request.
- For `/v1/*`, verify headers and JSON error shape.
- For legacy routes, verify the Vue frontend still surfaces the error message correctly through `api.fetch()`.

### 7. Wrong vs Correct

#### Wrong

```ts
return c.json({ message: 'invalid api key' }, 401)
```

for a new `/v1/*` route

#### Correct

```ts
return jsonError(c, 401, 'invalid_api_key', 'Invalid API key')
```

---

## API Error Responses

Do not treat these shapes as interchangeable.

- Legacy frontend-facing APIs are loosely shaped and often localized.
- `/v1/*` is the only route family with a stable machine-readable error schema.
- A few legacy endpoints return `c.json({ error: ... }, 400)` instead of `c.text(...)`; that inconsistency exists already, but new code should stay aligned with the specific route family it is extending.

---

## Common Mistakes

- Changing an existing route from text errors to JSON errors without updating its callers.
- Catching an error and returning a generic success payload instead of failing the request.
- Adding a `/v1/*` route without `jsonError()` and `x-request-id`.
- Relying on string matching of thrown DB errors when a migration would remove the need for that fallback path.
