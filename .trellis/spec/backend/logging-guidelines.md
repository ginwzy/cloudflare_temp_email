# Logging Guidelines

> How logging is done in this project.

---

## Overview

There is no dedicated logging library. The worker uses `console.log`, `console.warn`, and `console.error`.

Logs are plain text, so context has to be carried in the message itself.

Examples:

- `worker/src/common.ts`
- `worker/src/ip_blacklist.ts`
- `worker/src/scheduled.ts`
- `worker/src/email/index.ts`

---

## Log Levels

### `console.log`

Use for normal operational milestones:

- scheduled task start/end
- successful but notable side effects
- non-sensitive debug-style operational breadcrumbs

Examples:

- scheduled cleanup progress in `worker/src/scheduled.ts`
- successful AI extract completion in `worker/src/email/ai_extract.ts`

### `console.warn`

Use when the request or job can continue but behavior degraded:

- fallback paths
- invalid non-critical configuration
- blocked requests due to blacklist/rate limits

Examples:

- regex fallback warnings in `worker/src/ip_blacklist.ts`
- async update failures in `worker/src/common.ts`

### `console.error`

Use for caught exceptions and failed operations:

- D1 failures
- external API failures
- parsing failures
- background task failures

Examples:

- top-level worker error handler in `worker/src/worker.ts`
- OAuth/mail parsing/send failures in multiple route modules

---

## Structured Logging

Logs are not JSON-structured today. To keep them readable:

- prefix messages with the helper or feature name when possible
- include the minimal identifiers needed to debug the issue
- attach the error object as the last argument

Good current examples:

```ts
console.warn("[updateAddressUpdatedAt] failed:", address, e)
console.error('Error checking IP blacklist and rate limit:', error)
```

Avoid bare `console.error(error)` when a short prefix would make the source obvious.

---

## What to Log

- auth and access-control failures that matter operationally
- background job execution and cleanup results
- external provider failures (OAuth, Resend, Telegram, AI, webhook, S3)
- compatibility fallbacks and parse failures
- request context that is safe to expose, such as route, address, message id, or IP, when it materially helps debug

---

## What NOT to Log

- JWT secrets, admin passwords, API keys, SMTP secrets, or resend tokens
- raw password values
- full webhook headers or other secret-bearing payloads unless redacted first
- unbounded raw email bodies except in a deliberate debugging session

Known risk in the current codebase:

- some paths log webhook settings or provider responses more verbosely than ideal

Do not expand that pattern in new code. Prefer redacted summaries.
