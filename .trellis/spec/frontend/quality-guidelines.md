# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

Frontend quality in this repo depends more on consistency and manual verification than on automated test coverage.

Current reality:

- there is no committed frontend lint script
- there is no committed frontend automated test suite
- build success and manual smoke testing are the main safety net

Because of that, new changes need to stay close to existing patterns.

---

## Forbidden Patterns

- Calling worker APIs with raw `fetch` or a second axios instance when `frontend/src/api/index.js` already covers the request.
- Rendering untrusted HTML directly with raw `v-html`.
- Creating a second global store or duplicating auth/session state outside `useGlobalState()`.
- Copying `@ts-ignore` workarounds into new code when a local type or shared `.ts` helper would solve the problem.
- Adding more route-wide logic to large legacy screens when it can be extracted into a leaf component.

---

## Required Patterns

- Use `api.fetch()` or the existing `api.*` helpers for worker requests.
- Use `useMessage()` / `useNotification()` for user-visible feedback on async actions.
- Define component-local translations inline with `useI18n({ messages: { en, zh } })` when the strings are screen-specific.
- Use design tokens from `frontend/src/assets/design-system.css` and theme overrides from `frontend/src/theme/index.js`.
- For user-facing shell and inbox work, follow [`visual-design-guidelines.md`](./visual-design-guidelines.md) for layout, color, and motion contracts.
- Keep locale-aware navigation aligned with `frontend/src/router/index.js` and `getRouterPathWithLang()`.
- Sanitize HTML with existing helpers/components before rendering mail or announcement content.

---

## Testing Requirements

Minimum verification for frontend changes:

1. Run `cd frontend && pnpm build`.
2. If the worker serves frontend assets, also verify the relevant build target such as `pnpm build:pages` or `pnpm build:telegram:pages`.
3. Manually exercise the changed route in both Chinese and English when text or routing changed.
4. Manually check mobile layout when changing shared layouts, sidebars, tab bars, mailbox views, or admin tables.
5. For API contract changes, verify the matching worker endpoint at the same time.
6. If motion changed, verify `prefers-reduced-motion`, focus states, and that no animation exceeds the intended micro-interaction budget.

There is no automated test baseline to rely on instead of these checks.

---

## Code Review Checklist

- Does the screen use the shared API client and shared store patterns?
- Are dark mode, mobile layout, and locale-prefixed routes still correct?
- Is any rendered HTML sanitized?
- Did the change keep page composition in `views/` and reuse in `components/`?
- If TypeScript was added, did it reduce `any`/`@ts-ignore` rather than increase it?
