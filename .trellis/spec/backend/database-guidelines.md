# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

The backend uses Cloudflare D1 directly. There is no ORM.

The dominant pattern is:

```ts
const row = await c.env.DB.prepare(
  `SELECT value FROM settings WHERE key = ?`
).bind(key).first<string>('value')
```

Use:

- `.first<T>()` for a single row or single named column
- `.all()` for list queries
- `.run()` for mutations
- `.batch()` for grouped initialization/migration statements

Examples:

- `worker/src/utils.ts`
- `worker/src/common.ts`
- `worker/src/open_api/index.ts`

---

## Query Patterns

Project-specific patterns already in use:

- Parameterize queries with `.bind(...)`; do not interpolate user input into SQL strings.
- Use explicit `success` checks after writes.
- Keep list pagination consistent with `LIMIT ? OFFSET ?`.
- Persist JSON payloads in `TEXT` columns and parse/stringify at the edges.
- Update `updated_at` manually with `datetime('now')`.
- Use SQLite JSON helpers like `json_each(...)` when querying JSON-array-backed columns such as `address.tags`.

Examples:

- `worker/src/common.ts#handleListQuery`
- `worker/src/admin_api/index.ts` tag filters and tag statistics
- `worker/src/utils.ts#saveSetting`

---

## Migrations

Baseline schema lives in `db/schema.sql`.

Schema evolution currently happens in two places:

- dated SQL files in `db/`
- legacy in-app compatibility migrations in `worker/src/admin_api/db_api.ts`

For new schema work:

1. Add a dated SQL migration file in `db/`.
2. Update `db/schema.sql` so fresh installs match the latest schema.
3. If the worker must still upgrade older live databases through the admin UI, extend `worker/src/admin_api/db_api.ts`.

Examples:

- `db/2026-02-24-address-tags.sql`
- `db/2026-03-08-api-key-v1-upgrade.sql`
- `worker/src/admin_api/db_api.ts`

---

## Naming Conventions

- Tables use lowercase snake_case plural-ish names such as `raw_mails`, `users_address`, and `api_key_addresses`.
- Foreign key columns end in `_id`.
- Timestamps use `created_at`, `updated_at`, and occasionally domain-specific fields like `last_used_at`.
- Index names use `idx_<table>_<column>` or a short descriptive suffix.
- JSON-backed columns are still plain `TEXT` fields, for example `address.tags`, `settings.value`, `user_info`, and `api_idempotency.response_body`.

---

## Scenario: D1 Schema And JSON-Backed Columns

### 1. Scope / Trigger

- Trigger: add or change a D1 table, column, index, or JSON-backed payload field.
- Trigger: introduce a new endpoint or helper that reads/writes JSON stored in `TEXT`.

### 2. Signatures

- Read one row: `c.env.DB.prepare(sql).bind(...args).first<T>()`
- Read many rows: `c.env.DB.prepare(sql).bind(...args).all()`
- Write: `c.env.DB.prepare(sql).bind(...args).run()`
- Batch init/migration: `c.env.DB.batch(statements.map((s) => c.env.DB.prepare(s)))`
- Migration files: `db/YYYY-MM-DD-<topic>.sql`

### 3. Contracts

- `db/schema.sql` must describe the latest full schema for clean installs.
- New migrations must be additive and date-prefixed.
- JSON payloads stored in `TEXT` must have a safe default:
  - arrays default to `'[]'`
  - objects default to `'{}'` or null-by-convention
- If a row update changes a mutable entity, update `updated_at = datetime('now')`.
- If old databases may lack the new column, either migrate them first or add a guarded fallback path as seen in `worker/src/common.ts` and `worker/src/admin_api/db_api.ts`.

### 4. Validation & Error Matrix

| Case | Expected behavior |
|------|-------------------|
| Missing column on an older database | Migrate first or use a guarded fallback path |
| Invalid JSON stored in a `TEXT` column | Parse helper logs and returns safe null/empty fallback |
| Mutation `run()` returns `success = false` | Return operation failure to caller |
| Unbounded list query | Reject or clamp at route layer before DB call |

### 5. Good / Base / Bad Cases

- Good: add `db/2026-03-15-*.sql`, update `db/schema.sql`, and keep old deployments working if needed.
- Base: store tags as JSON text and query them with `json_each(a.tags)`.
- Bad: add a new column in code only and assume all deployed databases already have it.

### 6. Tests Required

- Apply the new SQL against a local D1 database or the admin DB migration UI.
- Exercise at least one read path and one write path that touch the new column/table.
- If compatibility fallback was added, verify both pre-migration and post-migration behavior.

### 7. Wrong vs Correct

#### Wrong

```ts
await c.env.DB.prepare(
  `INSERT INTO address(name, tags) VALUES('${name}', '${JSON.stringify(tags)}')`
).run()
```

#### Correct

```ts
await c.env.DB.prepare(
  `INSERT INTO address(name, tags) VALUES(?, ?)`
).bind(name, JSON.stringify(tags)).run()
```

---

## Common Mistakes

- Interpolating request data into SQL instead of binding parameters.
- Adding a migration file without updating `db/schema.sql`.
- Forgetting `updated_at = datetime('now')` on mutable records.
- Assuming JSON columns are already parsed objects inside route handlers.
- Forgetting that some production databases may lag the latest schema and need compatibility handling.
- Extending a multi-table delete/update flow without thinking through partial-success behavior. Existing cleanup/delete helpers execute sequential writes, not a transaction.
