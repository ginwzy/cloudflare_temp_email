# Remove Anonymous User Frontend Access

## Goal

Remove anonymous user (jwt-only, no userJwt) functionality from the frontend. All email operations require a registered user account. Backend APIs remain unchanged for backward compatibility.

## Background

The system has two JWT tokens:
- `jwt` — address-level token, identifies a specific email address
- `userJwt` — user-level token, identifies a logged-in user account

Currently, users can use the system anonymously with only `jwt` (no user account). This creates UX confusion (dual logout buttons, unclear state management) and is not the intended long-term design.

## Requirements

### Core Principle
- Frontend requires `userJwt` (user login) before any email operations
- `jwt` (address-level token) is still used internally for `/api/*` calls — the dual-token architecture stays
- Backend APIs are NOT modified — this is a frontend-only change
- Telegram flow is NOT affected

### File Changes

#### DELETE (1 file)
- `frontend/src/views/index/LocalAddress.vue` — purely anonymous local-cache address management

#### MODIFY (12 frontend files)

1. `views/common/Login.vue`
   - Remove credential login tab (raw JWT paste, lines 91-107, template 286-289)
   - Remove `disableAnonymousUserCreateEmail` check in `showNewAddressTab`
   - Keep password login and "Create New Email" tab (used by registered users)

2. `views/index/AddressBar.vue`
   - Remove `v-else` block (lines 97-111) that shows anonymous `<Login />` + "User Login" button
   - Replace with redirect to `/auth/login` when no `userJwt`
   - Remove `LocalAddress` from address manage modal (line 136), remove its import
   - Remove `Login` import (no longer used here)

3. `components/AddressSelect.vue`
   - Remove `localAddressCache` (useLocalStorage), `parseJwtAddress()`, `buildLocalOptions()`
   - Remove `scope === 'local'` handling in `onAddressChange()`
   - Simplify `refreshAddressOptions()` to only use `buildUserOptions()` (+ telegram)
   - Remove `'localAddresses'` group label i18n

4. `components/AppSidebar.vue`
   - Remove `LocalAddress` import and `v-else` fallback in manage modal
   - Simplify settings nav visibility: `!!settings.value.address || !!userJwt.value` → `!!userJwt.value`

5. `components/BottomTabBar.vue`
   - Same as AppSidebar: remove LocalAddress fallback, simplify conditions

6. `components/AddressSwitcher.vue`
   - Remove `LocalAddress` import and `v-else` fallback

7. `views/addresses/AddressesView.vue`
   - Remove `LocalAddress` import and `v-else` fallback (lines 28-33)
   - Show login redirect instead

8. `views/index/SimpleIndex.vue`
   - Replace anonymous `<Login />` fallback with redirect to `/auth/login`

9. `views/index/AccountSettings.vue`
   - Remove "Show Address Credential" button (raw JWT display) — not needed for registered users
   - Keep: change password, clear inbox/sent, delete address

10. `router/index.js`
    - Simplify settings `beforeEnter` guard: `!jwt.value && !userJwt.value` → `!userJwt.value`
    - Remove `?jwt=` URL parameter auto-login (lines 110-112)

11. `store/index.js`
    - Remove `disableAnonymousUserCreateEmail` from `openSettings` default

12. `api/index.js`
    - Remove `disableAnonymousUserCreateEmail` from `getOpenSettings()` response handling

## Acceptance Criteria

- [ ] Unauthenticated users (no `userJwt`) see only the login page, no anonymous address creation
- [ ] Registered users can still create, bind, switch, and manage addresses normally
- [ ] Address-level `jwt` still works internally for `/api/*` calls
- [ ] No references to `LocalAddress.vue` remain in the codebase
- [ ] No references to `localAddressCache` or `LocalAddressCache` remain
- [ ] `?jwt=` URL parameter no longer auto-logs in
- [ ] Telegram flow is unaffected
- [ ] Lint and typecheck pass

## Technical Notes

- The `Login.vue` component cannot be fully removed — registered users use it to create/bind addresses in `AddressManagement.vue` and `NewAddressView.vue`
- The `?jwt=` URL param removal means shared auto-login links will stop working
- Backend `DISABLE_ANONYMOUS_USER_CREATE_EMAIL` env var becomes effectively always-on but is not removed (backend unchanged)
- Existing anonymous addresses in the DB are unaffected; they'll be cleaned up by the existing `unboundAddress` cleanup mechanism
