# State Management

> How state is managed in this project.

---

## Overview

The frontend uses one global reactive store built with VueUse `createGlobalState()` plus storage-backed refs.

There is no Pinia, Vuex, or client-side query cache.

Most state falls into three buckets:

- global session/app state in `frontend/src/store/index.js`
- local screen state inside the owning component
- server state fetched on demand through `frontend/src/api/index.js`

---

## State Categories

### Global state

Use the global store for values that are shared across routes, layouts, or sessions:

- auth tokens: `auth`, `adminAuth`, `jwt`, `userJwt`
- open configuration: `openSettings`
- logged-in user data: `userSettings`, `userOpenSettings`
- app preferences: dark mode, sidebar state, mailbox split size, UTC toggle, auto refresh
- cross-screen draft state: `sendMailModel`

Reference: `frontend/src/store/index.js`

### Local state

Keep local UI state in the component when it is page-specific:

- current page and page size
- modal visibility
- selected rows
- filter inputs
- auto-refresh timers tied to one screen

Examples:

- `frontend/src/components/MailBox.vue`
- `frontend/src/views/admin/ApiKeyManagement.vue`
- `frontend/src/views/admin/Statistics.vue`

### URL state

The router carries only a small amount of state today, mostly:

- locale prefixes such as `/en/...`
- a few query parameters like `mail_id`

Examples:

- `frontend/src/router/index.js`
- `frontend/src/views/pages/InboxView.vue`

---

## When to Use Global State

Promote state into `useGlobalState()` only if at least one of these is true:

- multiple layouts or routes need it
- it must survive reloads through local/session storage
- it is part of the current auth/session identity
- other modules need to read and write it without prop drilling

Do not move one-screen form state, pagination, drawers, or filters into the store just for convenience.

---

## Server State

Server state is fetched imperatively and stored where it is used:

- `api.getOpenSettings()` merges into `openSettings.value`
- `api.getUserSettings()` merges into `userSettings.value`
- page-specific list/detail fetches stay in local refs

There is no normalized cache layer. Refresh is explicit:

- `onMounted()` for initial load
- `watch()` for route/filter/pagination changes
- user-triggered refresh buttons or timers for live pages

When a global server object exists already, update that shared ref instead of creating a second copy of the same payload elsewhere.

---

## Common Mistakes

- Putting screen-local state into the global store.
- Forgetting to update the `.fetched` flag on store-backed payloads.
- Duplicating auth or settings data in multiple refs instead of reading from `useGlobalState()`.
- Replacing the shared API hydration helpers with ad hoc fetch logic that drifts from the rest of the app.
