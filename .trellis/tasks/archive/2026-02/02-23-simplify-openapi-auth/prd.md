# Simplify Open API Auth - API Key Directly Associates Addresses

## Goal
Simplify the Open API authentication by removing the external JWT requirement. External consumers should only need `x-api-key` header instead of the current `x-api-key` + `jwt` double-credential system.

## Current Problem
1. External API consumers must manage two credentials: API key + JWT token
2. JWT is passed as query parameter (appears in logs, browser history)
3. If JWT is lost, the address becomes inaccessible
4. The internal address JWT mechanism is unnecessarily exposed to external consumers

## Design

### New Flow
```
Step 1: POST /open_api/api/address/create
        Header: x-api-key: sk-xxx
        Body: { name, domain }
        -> Returns { address } (address auto-linked to API key)

Step 2: GET /open_api/api/mails?address=test@example.com
        Header: x-api-key: sk-xxx
        -> Middleware verifies API key owns this address

Step 3: GET /open_api/api/mail/123?address=test@example.com
        Header: x-api-key: sk-xxx
        -> Same, single credential

Step 4: GET /open_api/api/addresses
        Header: x-api-key: sk-xxx
        -> List all addresses created by this API key
```

### Database Changes
- New table `api_key_addresses` (key_id INTEGER, address TEXT) for many-to-many relationship (one API key can create multiple addresses)
- Migration from v0.0.6 -> v0.0.7
- New migration file: `db/2026-02-23-api-key-addresses.sql`

### Backend Changes (worker/src/open_api/index.ts)
- Middleware: after validating API key, store `key_id` in Hono context
- Remove `verifyJwt` helper entirely
- `/address/create`: after `newAddress()`, INSERT into `api_key_addresses`, return `{ address }` only (no jwt)
- `/mails`: read `address` from query param, verify ownership via `api_key_addresses`
- `/mail/:id`: same ownership check
- `/address/extract/:mail_id`: same ownership check
- New endpoint `/addresses`: list all addresses for this API key

### Frontend Changes (ApiKeyManagement.vue)
- Update API documentation examples to remove JWT references
- Update i18n strings (remove docNote1 about JWT)
- Update curl examples to show new simplified flow

## Requirements
- One API key can create and manage multiple addresses
- Address ownership is verified via `api_key_addresses` table
- All existing endpoints maintain the same response structure (except removing jwt from create response)
- Usage counting continues to work the same way

## Acceptance Criteria
- [ ] New `api_key_addresses` table created via migration
- [ ] DB_VERSION bumped to v0.0.7
- [ ] `/open_api/api/address/create` returns `{ address }` without jwt
- [ ] `/open_api/api/mails?address=X` works with only x-api-key header
- [ ] `/open_api/api/mail/:id?address=X` works with only x-api-key header
- [ ] `/open_api/api/address/extract/:mail_id?address=X` works with only x-api-key header
- [ ] New `/open_api/api/addresses` endpoint lists addresses for the API key
- [ ] Frontend API docs updated with new curl examples
- [ ] JWT-related i18n strings updated

## Technical Notes
- `newAddress()` in common.ts still returns jwt internally - the open_api caller simply ignores it
- The `api_key_addresses` table uses `address TEXT` (the full email) rather than address_id, matching how mail queries use address text
- DB migration follows existing pattern: PRAGMA table_info check + ALTER/CREATE in db_api.ts
