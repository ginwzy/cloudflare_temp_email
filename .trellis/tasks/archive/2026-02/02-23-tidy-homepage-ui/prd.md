# Tidy Homepage UI

## Goal
Simplify the homepage login flow, hide settings when not logged in, and merge appearance settings into account settings page.

## Requirements
1. Remove the duplicate "创建新邮箱" button from the signin tab (the tab header already provides this)
2. Hide "设置" sidebar entry when no address JWT and no user JWT exist
3. Hide settings in mobile "More" drawer when not logged in
4. Add route guard on `/settings/*` to redirect to `/` when unauthenticated
5. Remove "外观" as a standalone settings sub-page
6. Merge the Appearance component into AccountSettings.vue
7. Redirect `/settings/appearance` to `/settings/account` for backward compatibility
8. Delete the now-unused AppearanceSettings.vue file

## Acceptance Criteria
- [ ] Login tab only has login form + login button (no extra "创建新邮箱" button)
- [ ] Sidebar hides "设置" when `!settings.address && !userJwt`
- [ ] Mobile "More" drawer hides settings when not logged in
- [ ] Direct URL `/settings/account` redirects to `/` when no JWT
- [ ] Settings sub-nav has no "外观" item
- [ ] Account settings page shows Appearance section at bottom
- [ ] `/settings/appearance` redirects to `/settings/account`
- [ ] AppearanceSettings.vue is deleted

## Files to Modify
- `frontend/src/views/common/Login.vue` — delete lines 306-311
- `frontend/src/components/AppSidebar.vue` — conditional show on settings nav item
- `frontend/src/components/BottomTabBar.vue` — conditional show on settings drawer item
- `frontend/src/router/index.js` — route guard + appearance redirect
- `frontend/src/layouts/SettingsLayout.vue` — remove appearance from nav
- `frontend/src/views/settings/AccountSettings.vue` — add Appearance component
- `frontend/src/views/settings/AppearanceSettings.vue` — delete file
