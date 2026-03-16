# Type Safety

> Type safety patterns in this project.

---

## Overview

The frontend is a mixed JavaScript/TypeScript codebase.

Current state:

- most Vue SFCs use plain `<script setup>`
- a smaller set of reusable wrappers and integration-heavy screens use `<script setup lang="ts">`
- shared types live in `.ts` modules such as `frontend/src/models/index.ts`
- `frontend/tsconfig.json` is strict, but that only helps where the code is actually written in TypeScript

This means runtime checks still matter. Do not assume the UI has end-to-end static typing for API payloads.

---

## Type Organization

Use these locations:

- `frontend/src/models/` for reusable cross-screen types
- typed utility modules in `frontend/src/utils/*.ts` for browser APIs or data helpers
- `lang="ts"` SFCs when a component needs typed props, external SDK types, or typed helper contracts

Examples:

- `frontend/src/models/index.ts`
- `frontend/src/utils/fingerprint.ts`
- `frontend/src/views/index/TelegramAddress.vue`

Keep one-off local view state in the component unless the type is reused elsewhere.

---

## Validation

There is no Zod/Yup/io-ts layer in the frontend today.

Runtime validation happens through:

- prop runtime definitions in `defineProps`
- manual form checks before submit
- backend validation and error responses
- sanitization helpers for untrusted HTML

Examples:

- `frontend/src/components/MailBox.vue` runtime prop definitions
- `frontend/src/components/ShadowHtmlComponent.vue` HTML sanitization path
- `frontend/src/api/index.js` central response/error handling

When adding a new external or backend payload:

- validate the minimum fields you need at runtime
- prefer narrowing the type in one place instead of spreading `any`

---

## Common Patterns

- Shared API/config types live in `frontend/src/models/index.ts`.
- Browser-facing helpers that benefit from types are written in `.ts` modules.
- TS SFC wrappers sometimes bridge existing JS modules.
- Locale-aware helpers like `getRouterPathWithLang()` live in typed utility files.

Example:

```ts
export const getFingerprint = async (): Promise<string> => {
  if (browserFingerprint.value) {
    return browserFingerprint.value
  }
  // ...
}
```

Reference: `frontend/src/utils/fingerprint.ts`

---

## Forbidden Patterns

- Adding more broad `@ts-ignore` comments as the default integration strategy.
- Adding reusable payload types inline in view files when they belong in `models/`.
- Spreading `any` through new admin/settings screens when a narrow type would be easy to define.
- Rendering untrusted HTML without the existing sanitizer path.

There are existing `@ts-ignore` compatibility shims in files such as `frontend/src/views/index/Webhook.vue` and `frontend/src/views/admin/Webhook.vue`. Treat those as legacy exceptions. New code should prefer moving the shared module or type definition into typed code instead of copying that pattern.
