---
name: Holder Frontend Pages
description: Architecture decisions and API path fixes for the holder portal pages and backend sharing/notification endpoints.
---

## Holder Pages (10 total — all in frontend/src/pages/holder/)
All pages fully rewritten with comprehensive modern UI. Key conventions used:
- Status filter tabs (not dropdowns) using `rounded-xl bg-muted/50 p-1` pill container
- Status-colored top strips on credential cards (`h-1.5 bg-gradient-to-r from-X to-Y`)
- `CardSkeleton` from SkeletonLoader for loading states
- `EmptyState` component for zero-data states
- All notifications read via `n.notification || n` (nested `notification` object from UserNotificationRecipient)

## Backend Fixes Applied

### Shares List (`GET /wallet/shares/`)
- Was incorrectly mapped to `get_share_link` (single-credential, required `credential_id` param)
- Fixed: mapped to `list` action on `CredentialSharingManagementViewSet`
- The `list` action queries `Credential.objects.filter(is_shareable=True, wallet=user.wallet)`
- Returns shape: `{id, credential_id, credential_type_name, token, share_token, access_count, expires_at, created_at}`

### Notification Delete (`DELETE /wallet/notifications/<id>/delete/`)
- Route added to `backend/apps/holder/urls.py` → maps to `UserNotificationsViewSet.destroy`
- Frontend API path was wrong (`/notifications/${id}/`) — fixed to `/wallet/notifications/${id}/delete/`

### Mark All Read (`POST /wallet/notifications/mark-all-read/`)
- Already implemented in `UserNotificationsViewSet.mark_all_read`
- Route was already in holder/urls.py

## Component Gotchas
- `Textarea` component (frontend/src/components/common/Textarea.jsx): no `hint` prop — use a `<p>` below the component for helper text
- `getWallets()` returns the wallet list from `/wallet/` (the wallet itself, not `/wallet/wallets/`)
- Notification unread check: `!n.is_read && n.status !== 'read'` (status field used by backend, is_read may be derived)

**Why:** The `get_share_link` action was designed for single-credential lookups with a query param; a separate `list` action was needed for the shares management page.
