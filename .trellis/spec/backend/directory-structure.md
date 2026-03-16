# Directory Structure

> How backend code is organized in this project.

---

## Overview

The backend is a Cloudflare Worker built with Hono and raw D1 SQL.

The codebase is organized primarily by route namespace and runtime responsibility:

- route handlers live in namespace folders such as `admin_api/`, `mails_api/`, `user_api/`, `open_api/`, and `telegram_api/`
- shared backend logic lives in `common.ts`, `utils.ts`, `constants.ts`, and `models/index.ts`
- inbound email processing lives in `email/`
- scheduled work lives in `scheduled.ts`
- database schema and SQL migrations live in `/db`

---

## Directory Layout

```text
worker/src/
├── worker.ts                  # Hono app bootstrap, middleware, route mounting
├── admin_api/                 # /admin/* handlers
├── mails_api/                 # /api/* handlers
├── user_api/                  # /user_api/* handlers
├── open_api/                  # /v1/* external API
├── telegram_api/              # Telegram bot + miniapp handlers
├── email/                     # Incoming email pipeline and side effects
├── i18n/                      # Worker-side localized messages
├── models/
│   └── index.ts               # Shared backend model/types
├── common.ts                  # Shared address/mail business logic
├── utils.ts                   # Env parsing, settings, helpers
├── constants.ts
├── scheduled.ts
└── types.d.ts                 # Hono bindings and context variables

db/
├── schema.sql                 # Current baseline schema
└── YYYY-MM-DD-*.sql           # Additive migration files
```

---

## Module Organization

Use the existing split before adding new files:

- Add route handlers to the folder that matches the URL prefix.
- Mount new handler groups through `worker/src/worker.ts`.
- Put shared DB/business logic in `worker/src/common.ts` when multiple route groups or the mail pipeline need it.
- Put env parsing and general helper logic in `worker/src/utils.ts`.
- Put inbound email-only logic in `worker/src/email/`.
- Put schema changes in `/db` first, then add compatibility handling only if old deployed databases must keep working.

Examples:

- `worker/src/worker.ts`
- `worker/src/mails_api/index.ts`
- `worker/src/admin_api/index.ts`
- `worker/src/open_api/index.ts`

---

## Naming Conventions

- Route namespaces use folder names that mirror the public prefix: `admin_api`, `mails_api`, `user_api`, `open_api`, `telegram_api`.
- Handler files often end with `_api.ts` when the module is a focused handler set, for example `admin_user_api.ts` or `api_key_api.ts`.
- Shared models live in `models/index.ts`.
- Route modules usually export `api` or a default object of handler functions.
- SQL migration filenames are date-prefixed and descriptive, for example `2026-03-08-api-key-v1-upgrade.sql`.

---

## Examples

Good examples to follow:

- `worker/src/worker.ts`: top-level middleware, auth, and mounting.
- `worker/src/open_api/index.ts`: self-contained route namespace with its own response contract.
- `worker/src/common.ts`: reusable business logic used across route groups.
- `db/schema.sql`: current baseline schema for fresh deployments.
