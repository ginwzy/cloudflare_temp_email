# Component Guidelines

> How components are built in this project.

---

## Overview

Most frontend UI is written as Vue 3 single-file components using `<script setup>`.

The common shape is:

1. imports
2. `useMessage()` / `useNotification()` / `useI18n()`
3. `useGlobalState()` when shared state is needed
4. local `ref` / `computed` / `watch` / lifecycle hooks
5. a template built mostly from Naive UI primitives
6. scoped CSS using `--ds-*` design tokens

Examples:

- `frontend/src/components/MailBox.vue`
- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/views/admin/components/AccountTablePanel.vue`

---

## Component Structure

Preferred structure for new components:

```vue
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:value'])

const model = computed({
  get: () => props.value,
  set: (value) => emit('update:value', value)
})
</script>

<template>
  <n-input v-model:value="model" />
</template>

<style scoped>
.root {
  color: var(--ds-text);
}
</style>
```

Use this pattern when a component is a reusable leaf. See `frontend/src/views/admin/components/AccountTablePanel.vue`.

Keep route pages focused on composition and data loading. Large legacy files such as `frontend/src/views/admin/Account.vue` exist, but new work should prefer extracting focused child components instead of growing those files further.

---

## Props Conventions

Props are usually declared with runtime `defineProps({ ... })`, not TS interfaces.

Current conventions:

- Use runtime `type`, `default`, and `required` metadata.
- Pass callback props for mailbox-like reusable panels (`fetchMailData`, `fetchMailDetail`, `deleteMail` in `frontend/src/components/MailBox.vue`).
- Use `defineEmits()` plus computed getter/setter wrappers for `v-model`-style APIs.
- Use `lang="ts"` only when the component genuinely benefits from stronger types; most SFCs are still plain JS.

Examples:

- `frontend/src/components/MailBox.vue`
- `frontend/src/views/admin/components/AccountTablePanel.vue`
- `frontend/src/views/admin/UserAddressManagement.vue`

---

## Styling Patterns

The project uses:

- Naive UI components for most form, modal, table, and layout primitives
- global design tokens in `frontend/src/assets/design-system.css`
- Naive UI theme overrides in `frontend/src/theme/index.js`
- component-local `<style scoped>` blocks for layout-specific CSS

Visual target for the next refresh:

- follow [`visual-design-guidelines.md`](./visual-design-guidelines.md) for color, typography, surface, and motion decisions
- treat inbox-family UI as a message workspace, not a generic dashboard

Rules for new components:

- Reuse `var(--ds-*)` tokens instead of hard-coding a new palette.
- Prefer Naive UI primitives over custom widgets when an equivalent already exists.
- Keep page-level layout CSS inside the SFC unless multiple screens share it.
- When rendering email or announcement HTML, route it through existing sanitizers and helper components instead of raw `v-html`.
- Use motion to support focus, reveal, and selection only; do not add decorative animation to every control.

Examples:

- `frontend/src/layouts/AppLayout.vue`
- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/components/ShadowHtmlComponent.vue`

---

## Accessibility

Accessibility is mostly delegated to Naive UI controls. Follow these project-specific rules:

- Prefer `n-button`, `n-input`, `n-modal`, `n-drawer`, `n-pagination`, and similar components over custom clickable containers.
- Keep destructive actions behind confirm dialogs or explicit secondary actions.
- Preserve loading and error feedback through `useMessage()` or `useNotification()`.
- Sanitize untrusted HTML before rendering. `frontend/src/components/ShadowHtmlComponent.vue` and `frontend/src/components/MailContentRenderer.vue` are the patterns to follow.

There are existing clickable `div` navigation items in layout files. Treat those as legacy code, not the preferred pattern for new interactive UI.

---

## Common Mistakes

- Rendering server-provided HTML directly with raw `v-html` instead of `sanitizeMailHtml()` / `sanitizeRichTextHtml()`.
- Calling `fetch` or `axios` directly from a component for worker APIs instead of using `frontend/src/api/index.js`.
- Duplicating large in-component table or modal logic when a reusable leaf component would be clearer.
- Adding more keyboard-inaccessible clickable containers when a button or link component would work.
