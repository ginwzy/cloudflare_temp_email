# Telegram-Inspired Inbox Refresh

## Goal

Refresh the user-facing frontend with a Telegram-inspired inbox workspace that improves hierarchy, scanability, and motion quality without turning the product into a chat clone.

This task exists to preserve the agreed direction before implementation work starts, so future UI changes stay aligned with the approved visual language and preview draft.

## Requirements

- Follow the design direction defined in `.trellis/spec/frontend/visual-design-guidelines.md`.
- Treat the inbox as the primary workspace and prioritize the mail list + detail reading experience over generic dashboard styling.
- Use the static preview at `frontend/public/telegram-inspired-draft.html` as a reference artifact for tone, surfaces, motion, and layout rhythm.
- Keep the product identity as a mail tool, not a messaging clone.
- Preserve light mode, dark mode, mobile layout, and accessibility constraints.
- Use motion only for focus, reveal, selection, loading, and panel transitions.
- Respect `prefers-reduced-motion` in any future implementation.
- Keep the first implementation pass focused on shared shell and inbox surfaces instead of redesigning every page at once.

## Non-Goals

- Do not rebuild the app into a Telegram lookalike with message bubbles everywhere.
- Do not redesign admin pages as part of the first implementation pass unless they reuse shared shell tokens/components.
- Do not introduce heavy decorative motion, parallax, or continuous animations.
- Do not rewrite backend contracts, API flows, or data structures for this task.

## Priority Implementation Areas

- `frontend/src/assets/design-system.css`
- `frontend/src/theme/index.js`
- `frontend/src/layouts/AppLayout.vue`
- `frontend/src/components/AppSidebar.vue`
- `frontend/src/components/BottomTabBar.vue`
- `frontend/src/components/MailBox.vue`

## Acceptance Criteria

- [ ] The task has a stable design source of truth in frontend spec docs.
- [ ] The task has a preview artifact showing the target visual direction.
- [ ] Future implementation work references the inbox workspace model: `Sidebar | Mail List | Mail Detail`.
- [ ] Motion rules are explicit: duration, easing, allowed motion, and prohibited motion.
- [ ] Mobile behavior is explicit: bottom nav remains fixed and detail opens as a sheet/push-style context.
- [ ] Typography, color, surface, and active-state rules are defined before UI implementation starts.
- [ ] The first real implementation pass stays scoped to shared shell and inbox-family components.

## Technical Notes

- The current design spec is in `.trellis/spec/frontend/visual-design-guidelines.md`.
- Supporting implementation conventions remain in:
  - `.trellis/spec/frontend/component-guidelines.md`
  - `.trellis/spec/frontend/quality-guidelines.md`
  - `.trellis/spec/frontend/state-management.md`
- The preview artifact is intentionally static and should not be treated as production-ready component code.
- Any implementation derived from this task should be validated in light mode, dark mode, desktop, mobile, and reduced-motion scenarios.
