# Directory Structure

> How frontend code is organized in this project.

---

## Overview

The frontend lives under `frontend/` and is a Vue 3 SPA built with Vite, Naive UI, Vue Router, Vue I18n, and VueUse.

The structure is route-first:

- `views/` holds page-level screens grouped by product area.
- `layouts/` holds shells that own route-level loading, navigation, and page metadata.
- `components/` holds reusable UI blocks used by multiple views.
- `api/` holds the single axios-based API wrapper.
- `store/` holds the single global reactive store.
- `utils/`, `theme/`, and `models/` hold shared helpers, theme tokens, and TypeScript types.

---

## Directory Layout

```text
frontend/src/
├── api/
│   └── index.js               # Axios wrapper + auth headers + store hydration helpers
├── assets/
│   └── design-system.css      # Global CSS variables
├── components/                # Reusable UI blocks
├── layouts/                   # Route shells
├── views/
│   ├── admin/                 # Admin pages and admin-only subcomponents
│   ├── addresses/             # Address management pages
│   ├── auth/                  # Auth entry pages
│   ├── index/                 # Mailbox/home widgets
│   ├── pages/                 # Main routed pages (Inbox, Sent, Compose)
│   └── settings/              # User settings screens
├── router/
│   └── index.js               # Route tree and auth/lang guards
├── store/
│   └── index.js               # Global app/session state
├── theme/
│   └── index.js               # Naive UI theme overrides
├── utils/                     # Helpers, sanitizers, parsing, composables
├── models/                    # Shared TS types
├── constant/
├── App.vue
├── i18n.ts
└── main.js
```

---

## Module Organization

Add new code where the current codebase already expects it:

- Put new routed screens in `views/<area>/`.
- Put layout-only navigation or chrome in `layouts/`.
- Put shared visual building blocks in `components/`.
- Put global state in `store/index.js` only when multiple routes/layouts need it.
- Put browser/platform helpers in `utils/`.
- Put shared TypeScript shapes in `models/` or a typed helper module, not inline in many views.

Current route areas already imply ownership:

- `views/pages/` is the primary mailbox flow.
- `views/admin/` is the admin control surface.
- `views/settings/` is authenticated user settings.
- `views/auth/` is login/register/forgot-password.
- `views/index/` contains mailbox-adjacent panels reused by the app shell.

---

## Naming Conventions

- Vue SFCs use `PascalCase.vue`.
- Layout files end in `Layout.vue`.
- Route screens usually end in `View.vue`, `Page.vue`, or a domain name like `Statistics.vue`.
- Utility modules use lowercase or kebab/camel style JavaScript/TypeScript filenames such as `composables.js`, `safe-html.js`, and `fingerprint.ts`.
- Shared store access is exposed as `useGlobalState()`.

Keep new names aligned with existing route vocabulary instead of inventing a parallel folder taxonomy.

---

## Examples

Good examples to follow:

- `frontend/src/layouts/AppLayout.vue`: route shell that loads settings and composes shared chrome.
- `frontend/src/views/admin/AdminUsersPage.vue`: page-level composition that delegates real work to smaller admin components.
- `frontend/src/views/admin/components/AccountTablePanel.vue`: reusable admin leaf component with a narrow prop and emit surface.
- `frontend/src/api/index.js`: all worker API calls funnel through one shared client.
