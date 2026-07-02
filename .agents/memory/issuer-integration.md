---
name: Issuer Integration
description: Architecture decisions and gotchas for the issuer portal (backend + frontend).
---

## Key Decisions

### Backend
- All issuer endpoints live under `/api/issuer/` via `backend/apps/issuer/urls.py`.
- The registration wizard uses `IssuerRegistration` + `IssuerRegDocument` models in `organizations` app (NOT issuer app), because they're pre-auth.
- `IssuerRegDocument` db_table is `registration_documents_v2` to avoid clashing with the old `RegistrationDocument` model in `organization.py` (same app, same Django label — a name clash causes `RuntimeError: Conflicting models`). **Never rename it back to `RegistrationDocument`.**
- Federated member verification uses `FederatedMemberService` in `issuer/services/federated_member_service.py` — 10s timeout, audit logging.
- If a holder has no wallet account yet, credentials are issued with `render_metadata.pending_holder_registration = True` and linked to the member identifier, not a DID.

### Frontend
- `src/api/issuer.js` is the single source of truth for all issuer API calls. Function names follow pattern: `getX`, `createX`, `updateX`, `deleteX`, `actionX`.
- `markNotificationsRead({ notification_ids: [...] })` replaces the old per-notification endpoint — send all IDs in one call.
- `FileUpload` component props: `onDrop` (dropzone callback), `files` (array), `onRemove` (index callback), `multiple`, `accept`, `label`. Does NOT have `onFilesChange` or `maxFiles`.
- Template editor route is `/issuer/templates/:id` (not `:id/edit`) — `useParams()` gets `id`; `id === 'new'` check determines create vs edit mode.
- `ApiConfigPage` route: `/issuer/api-config` — added to both App.jsx and IssuerLayout navItems.

**Why:** The IssuerRegDocument name conflict caused a silent autoreloader crash that looked like a code issue but was purely a Django model registry collision.

**How to apply:** When adding any new model to the `organizations` app, grep for existing class names in all `models/*.py` files first.
