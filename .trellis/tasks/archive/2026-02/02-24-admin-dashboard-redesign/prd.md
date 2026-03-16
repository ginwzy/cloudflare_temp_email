# Redesign Admin Dashboard

## Goal
Redesign the admin dashboard page with a data-dense, Cloudflare/Grafana-inspired style. Full enhancement: optimized stats, quick actions, system info, and recent activity.

## Current State
- `AdminDashboard.vue` renders `Statistics.vue`
- Statistics.vue shows 6 `n-statistic` cards in 2 rows (address count, 7d/30d active, user count, mail count, sent count)
- API: `GET /admin/statistics` returns these 6 numbers
- Tech: Vue 3 + Naive UI + custom CSS vars (design-system.css)
- No CSS framework (Tailwind etc.) — scoped CSS with `--ds-*` variables

## Requirements
- Redesign dashboard content only (AdminLayout sidebar stays unchanged)
- Data-dense style (high information density, Cloudflare/Grafana-like)
- Dark mode support via existing CSS variables
- Mobile responsive
- Keep existing i18n pattern (en/zh inline messages)

## Sections
1. **Statistics cards** — redesigned with better visual hierarchy, icons, subtle colors
2. **Quick actions** — shortcuts to common admin tasks (create address, send mail, manage users, etc.)
3. **System info** — DB version, worker config summary
4. **Recent activity** — latest received/sent emails list

## Acceptance Criteria
- [ ] All 6 existing stats displayed with improved design
- [ ] Quick action buttons navigate to relevant admin pages
- [ ] System info section shows DB version and key config
- [ ] Recent emails list (latest 5-10)
- [ ] Dark mode works correctly
- [ ] Mobile responsive layout
- [ ] No new dependencies added
