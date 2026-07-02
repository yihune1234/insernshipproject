---
name: API Endpoint Prefix Map
description: Correct URL prefixes for the three role dashboards and system endpoints
---

## Notification Endpoints

The frontend notification API files were updated to use `/organizations/` prefix:
- Holder: `/api/organizations/holder/notifications/`
- Issuer: `/api/organizations/issuer/notifications/`
- Verifier: `/api/organizations/verifier/notifications/`

These live in `organizations/urls.py` which is mounted at `api/organizations/`.

## JWKS

- Root: `/jwks` (no `api/` prefix)
- Alias: `/api/jwks` (added to digital_wallet/urls.py for frontend compatibility)

## VerifierProfile

The `verification.VerifierProfile` model is separate from `organizations.Verifier`. It must be seeded for the test verifier user. Added to `create_test_users` management command via `_ensure_verifier_profile()`.

## Key Working Endpoints (all return 200)

| Role | Endpoint |
|------|----------|
| Holder | `/api/holder/profile/`, `/api/wallets/`, `/api/wallet/dids/`, `/api/users/profile/` |
| Holder | `/api/holder/my-credentials/`, `/api/holder/my-credentials/stats/` |
| Issuer | `/api/issuer/credentials/`, `/api/issuer/templates/`, `/api/issuer/stats/organization/` |
| Issuer | `/api/organizations/issuer/profile/` |
| Verifier | `/api/verification/requests/`, `/api/verification/presentations/`, `/api/verification/verifier/profile/` |
| System | `/api/health/`, `/api/version/`, `/api/jwks`, `/.well-known/openid-credential-issuer` |

**Why:** These were diagnosed from 500/404 errors in the wallets, DID list, holder profile, and notification views. Fixes involved correcting DID field names and aligning frontend paths with backend URL structure.
