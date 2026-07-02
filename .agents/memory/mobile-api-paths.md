---
name: Mobile API Path Corrections
description: Correct API paths for the mobile Expo app and the backend endpoints that were missing/added to support them.
---

## Rule
Mobile services must use `/wallet/` prefix for holder credential endpoints, not `/holder/`.

**Why:** The backend mounts holder endpoints at `api/wallet/` (apps.holder.urls) but original mobile code used `/holder/my-credentials/` which never existed. Both frontend and mobile were calling wrong paths; we added backend aliases.

**Correct Mobile → Backend Path Map:**

| Mobile Service | Path Used | Backend Status |
|---|---|---|
| credentialApi.listCredentials | `/wallet/my-credentials/` | Added alias (same as `/wallet/credentials/`) |
| credentialApi.getCredential | `/wallet/my-credentials/<id>/` | Added alias |
| credentialApi.createCredentialRequest | `/wallet/credentials/request/` | ✅ already existed |
| credentialApi.getRequestCatalog | `/wallet/request-catalog/` | Added new endpoint |
| sharingApi.enableSharing | `/wallet/shares/enable/` | Added ShareEnableView |
| sharingApi.disableSharing | `/wallet/shares/disable/` | Added ShareDisableView |
| sharingApi.getShareStats | `/wallet/shares/stats/` | Added ShareStatsView |
| notificationService.fetchNotifications | `/notifications/` | ✅ already existed |
| notificationService.markAsRead | `/notifications/mark-read/` | ✅ POST with `{notification_id}` in body |
| notificationService.markAllRead | `/notifications/mark-all-read/` | ✅ POST |

**How to apply:** Any new mobile service hitting wallet endpoints must use `/wallet/` prefix. ShareEnableView returns `{share_token, share_url, qr_code}`. HolderCredentialListView returns paginated `{results, count, next, previous}`.

## Organization Model
- Organization.org_type → FK to OrganizationType (not `organization_type`)
- Credential.credential_type → CharField (no separate CredentialType model)
- Organization.did → OneToOne to DID model; access via `org.did.did_string`
