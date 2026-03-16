# Hook Guidelines

> How hooks are used in this project.

---

## Overview

This codebase has very few standalone composables. Most stateful logic stays in:

- `frontend/src/store/index.js` for app-wide state
- `frontend/src/api/index.js` for API access and global data hydration
- the component that owns the screen

The main reusable composable pattern today is small browser/UI helpers, not a large `hooks/` layer.

Examples:

- `frontend/src/utils/composables.js`
- `frontend/src/store/index.js`
- `frontend/src/utils/fingerprint.ts`

---

## Custom Hook Patterns

Create a new composable only when one of these is true:

- the logic is used by multiple unrelated screens
- the logic wraps a browser capability or responsive concern
- the logic would otherwise duplicate a `watch`/lifecycle block in several places

Current examples:

- `useIsMobile()` wraps `vooks` breakpoints in `frontend/src/utils/composables.js`
- `useGlobalState()` owns cross-route application state in `frontend/src/store/index.js`

If logic is specific to one screen, keep it inside that screen instead of extracting a generic composable too early. `frontend/src/components/MailBox.vue` is a good example of component-owned local orchestration.

---

## Data Fetching

There is no React Query/SWR-style client cache.

Project pattern:

- All worker API requests go through `frontend/src/api/index.js`.
- Components fetch data imperatively in `onMounted()`, `watch()`, or explicit action handlers.
- Shared bootstrap calls such as open settings and user settings live in the API wrapper and mutate the global store.

Use:

- `api.fetch()` for one-off requests
- `api.getOpenSettings()`, `api.getSettings()`, `api.getUserSettings()` for the existing global hydration flows

Do not build a parallel request wrapper inside a new composable unless you are replacing the shared API module intentionally.

---

## Naming Conventions

- Reusable stateful helpers use the `use*` prefix.
- Composables return refs/computeds instead of plain snapshots.
- Global shared state stays under `useGlobalState()`.
- Route-specific fetch helpers are usually ordinary functions inside the SFC rather than named composables.

Examples:

- `useIsMobile`
- `useGlobalState`

---

## Common Mistakes

- Creating a new composable for logic that is only used by one screen.
- Duplicating auth headers or fingerprint logic outside `frontend/src/api/index.js`.
- Storing transient page-local modal or table state in the global store.
- Returning plain values from a composable when the caller needs reactive refs.
