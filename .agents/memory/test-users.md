---
name: Test Users and FINs
description: Standard test accounts created by manage.py create_test_users and canonical NID FINs for development testing.
---

## Rule
Always run `python manage.py seed_org_types && python manage.py create_test_users` after a fresh `migrate` to populate standard test accounts.

**Why:** The three portals (holder, issuer, verifier) all require specific role assignments and approved organization memberships; hand-creating them is error-prone.

## Test Accounts (password: `password123`, admin: `admin123`)
| Portal   | Email                        | Password    | Notes |
|----------|------------------------------|-------------|-------|
| Admin    | admin@system.com             | admin123    | superuser |
| Holder   | holder@example.com           | password123 | FIN 123456789012, NID verified |
| Issuer   | issuer@university.edu        | password123 | Test University, trust_level=high |
| Verifier | verifier@government.gov      | password123 | Test Government Verifier |

## Canonical NID FINs for simulation
- `123456789012` — Test Holder (matches holder@example.com)
- `ETH001234567` — Abebe Bikila
- `ETH007654321` — Tigist Haile
- `TEST001`, `TEST002` — Generic test citizens
- `TEST12345678` — Test Integration Citizen
- Any FIN with ≥6 chars works; synthetic profile auto-generated.
- OTP: any 6-digit number (e.g. `000000`)

## DID model note
`DID` model has `is_published` (bool), NOT `is_primary`. The `create_test_users` command uses `is_published=True` in defaults.
