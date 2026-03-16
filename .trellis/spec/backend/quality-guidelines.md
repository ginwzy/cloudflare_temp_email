# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

Backend quality here comes from:

- staying inside the existing Hono route/module structure
- reusing shared helpers before adding new ones
- preserving the correct error contract for each route family
- verifying lint/build/manual behavior, because automated test coverage is currently absent

Current repo reality:

- `worker/` has an ESLint config and build scripts
- there is no committed backend automated test suite
- the checked-in GitHub workflow is a deploy workflow, not a CI test workflow

---

## Forbidden Patterns

- Duplicating auth, pagination, or address-creation logic when helpers already exist in `worker/src/worker.ts`, `worker/src/common.ts`, or `worker/src/utils.ts`.
- Building SQL with interpolated request data instead of `.bind(...)`.
- Mixing the `/v1/*` JSON error contract into legacy route families or vice versa.
- Logging secrets, full credentials, or raw sensitive payloads.
- Spreading `any` and `@ts-ignore` into new code when `Context<HonoCustomType>` or a narrow local type would work.

---

## Required Patterns

- Route handlers should live under the namespace folder that matches the public path.
- Reuse shared helpers like `newAddress`, `handleListQuery`, `getSetting`, `saveSetting`, and `updateAddressUpdatedAt` where applicable.
- Pull localized strings from worker i18n for legacy frontend-facing routes.
- Preserve the current route-family contract:
  - legacy routes: mostly text errors
  - `/v1/*`: structured JSON errors via `jsonError()`
- For schema changes, update both `db/schema.sql` and a dated migration file.

---

## Testing Requirements

Minimum verification for backend changes:

1. Run `cd worker && pnpm lint`.
2. Run `cd worker && pnpm build`.
3. Manually exercise at least one success path and one failure path for the changed endpoint or scheduled flow.
4. If the change touches frontend-consumed routes, verify the matching UI action still works.
5. If the change touches D1 schema, verify both schema creation and migration behavior.

There is no automated test suite to substitute for these checks.

---

## Code Review Checklist

- Does the file live in the correct route namespace or shared helper layer?
- Did the change reuse an existing helper instead of re-implementing it?
- Is SQL parameterized and schema-compatible?
- Does the response shape match the caller's expected contract?
- Are logs contextual but non-sensitive?
- Were `db/schema.sql` and migration files updated together when schema changed?
- If password or token logic changed, do create/login/change flows still agree on hashing and comparison behavior?
