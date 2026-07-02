# Test Seed Data — Digital Credential Wallet Platform

All accounts share the same password: **`TestPass123!`**

---

## Admin

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@credwallet.et` | TestPass123! | admin | Admin portal, org approvals, reports, audit logs, platform stats |

---

## Issuers (Credential Sync Management)

| Email | Password | Organization | Credentials |
|-------|----------|-------------|-------------|
| `aau.issuer@credwallet.et` | TestPass123! | Addis Ababa University | 5 student enrollment credentials |
| `corp.issuer@credwallet.et` | TestPass123! | TestCorp Ltd | 3 employment records |
| `gov.issuer@credwallet.et` | TestPass123! | Ministry of Finance | 2 employment certificates |
| `hospital.issuer@credwallet.et` | TestPass123! | City Hospital | 1 medical practitioner license |

Actions available: issue credential, bulk issue, update status, check member eligibility, manage team members

---

## Verifiers

| Email | Password | API Key Available |
|-------|----------|-------------------|
| `verify1@credwallet.et` | TestPass123! | Yes (default API key) |
| `verify2@credwallet.et` | TestPass123! | Yes (default API key) |

Actions available: verify credentials, view verification history, create/rotate/revoke API keys

### Verification Results (7 total, 6 passed + 1 failed)

| Credential | Verifier | Result |
|-----------|----------|--------|
| AAU-CRED-STU-2024-001 | verify1@credwallet.et | Passed |
| AAU-CRED-STU-2024-002 | verify2@credwallet.et | Passed |
| AAU-CRED-STU-2024-003 | verify1@credwallet.et | Passed |
| AAU-CRED-STU-2023-010 | verify2@credwallet.et | Passed |
| CORP-EMP-001 | verify1@credwallet.et | Passed |
| AAU-CRED-STU-2024-001-ATTEMPT | verify1@credwallet.et | **Failed** (signature mismatch) |

---

## Holders

| Email | Password | NID / FIN | Credentials | Shares | Presentations |
|-------|----------|-----------|-------------|--------|--------------|
| `amara.osei@holder.et` | TestPass123! | NID-1234567890 | 3 active | AAU enrollment, CORP employment | 1 |
| `kwabena.mensah@holder.et` | TestPass123! | NID-0987654321 | 3 active | AAU enrollment, CORP employment | 1 |
| `aba.ansah@holder.et` | TestPass123! | NID-1111111111 | 1 active | AAU enrollment | 1 |
| `kofi.asante@holder.et` | TestPass123! | NID-2222222222 | 2 active (enrollment + medical license) | AAU enrollment, HOSP medical | 1 |
| `efua.boateng@holder.et` | TestPass123! | NID-3333333333 | 2 (1 revoked, 1 expired) | — | — |

Actions available: view wallet, share credentials, create presentations, request credentials, view notifications, manage org mappings

### Holder Credential Shares (7 total, active, 24h expiry)

| Credential | Holder |
|-----------|--------|
| AAU-CRED-STU-2024-001 | amara.osei@holder.et |
| CORP-EMP-001 | amara.osei@holder.et |
| AAU-CRED-STU-2024-002 | kwabena.mensah@holder.et |
| CORP-EMP-002 | kwabena.mensah@holder.et |
| AAU-CRED-STU-2024-003 | aba.ansah@holder.et |
| AAU-CRED-STU-2023-010 | kofi.asante@holder.et |
| HOSP-MED-2024-001 | kofi.asante@holder.et |

### Holder-Org Mappings

amara.osei, kwabena.mensah, and aba.ansah are each mapped to 3 organizations.

---

## Organizations

| Organization | Type | Status | Issuer Contact |
|-------------|------|--------|---------------|
| Addis Ababa University | University | approved | aau.issuer@credwallet.et |
| TestCorp Ltd | Private Company | approved | corp.issuer@credwallet.et |
| Ministry of Finance | Government Agency | approved | gov.issuer@credwallet.et |
| City Hospital | Hospital | approved | hospital.issuer@credwallet.et |
| EduVerify Agency | Verification Agency | approved | — |
| TrustCheck Corp | Verification Agency | approved | — |

---

## DID Documents (7 total)

| DID | Owner |
|-----|-------|
| did:et:holder:* | 5 holders (amara.osei through efua.boateng) |
| did:et:verifier:* | 2 verifiers (verify1, verify2) |

Each DID has one Ed25519 key pair (public + encrypted private).

---

## Other Data

| Entity | Count | Notes |
|--------|-------|-------|
| Trust Levels | 5 | Basic → Government / Sovereign |
| Organization Types | 6 | University, Government, Private, Hospital, Verification, Financial |
| Integration Configs | 4 | One per credential-issuing org |
| Notifications | 6 | Credential received + revoked alerts |
| Audit Logs | 18 | Org approvals, logins, credential syncs |
| Platform Stats | 1 | Current date entry for admin dashboard |
| Accreditations | 4 | Trust registry entries for issuing orgs |

---

## How to Run Seed Scripts

```bash
cd backend
source venv/bin/activate

# Base seed (users, orgs, credentials, wallets, notifications, audit logs)
python manage.py seed_test_data --reset   # Start fresh (resets all seed data)

# Extra seed (DIDs, shares, presentations, mappings, verifications, stats)
python manage.py seed_extra_test_data
```
