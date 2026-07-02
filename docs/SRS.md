# Software Requirements Specification (SRS)

## Digital Credential Wallet System

| Field | Value |
|-------|--------|
| **Document title** | Software Requirements Specification — Digital Credential Wallet |
| **Version** | 1.0 |
| **Date** | 23 May 2026 |
| **Status** | Draft (aligned with repository `newportal` branch) |
| **Repository** | DigitalCredentialWallet |
| **Prepared for** | Product owners, developers, QA, security reviewers, and integrators |

---

## Table of Contents

1. [Introduction](#1-introduction)  
2. [Overall Description](#2-overall-description)  
3. [System Context and Architecture](#3-system-context-and-architecture)  
4. [User Classes and Characteristics](#4-user-classes-and-characteristics)  
5. [Functional Requirements](#5-functional-requirements)  
6. [External Interface Requirements](#6-external-interface-requirements)  
7. [Data Requirements](#7-data-requirements)  
8. [Non-Functional Requirements](#8-non-functional-requirements)  
9. [Security and Privacy Requirements](#9-security-and-privacy-requirements)  
10. [Standards and Interoperability](#10-standards-and-interoperability)  
11. [Constraints and Assumptions](#11-constraints-and-assumptions)  
12. [Future Enhancements](#12-future-enhancements)  
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the **Digital Credential Wallet System** — an enterprise platform for issuing, holding, presenting, and verifying **W3C-aligned digital credentials** (Verifiable Credentials).

The document is intended to:

- Guide development, testing, and acceptance of the system
- Communicate scope to stakeholders (government, issuers, verifiers, citizens)
- Serve as a baseline for traceability between features, APIs, and user journeys

### 1.2 Scope

The system consists of:

| Component | Location | Description |
|-----------|----------|-------------|
| **Backend API** | `backend2/` | Django REST API: identity, organizations, credentials, verification, DIDs, trust registry, audit |
| **Web portals** | `frontend/` | React (Vite) applications for Admin, Issuer, Verifier, and Holder (web) |
| **Mobile wallet** | `holderapp/` | Expo / React Native holder app (offline-first) |
| **NID integration (dev)** | `test_integration/` | Mock National ID service for development |
| **Documentation** | `docs/` | Flows, API notes, module reports |

**In scope:** Registration, organization onboarding, credential types and templates, issuance, wallet storage, sharing, presentation, verification, revocation, status lists, trust registry, audit logging, DID management.

**Out of scope (current release):** Full OID4VCI/OID4VP wallet protocol, production SD-JWT selective disclosure, JSON-LD / Linked Data Proofs, unified single DID registry (two DID models coexist), blockchain anchoring.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **VC** | Verifiable Credential (W3C) |
| **VP** | Verifiable Presentation |
| **DID** | Decentralized Identifier |
| **did:key** | DID method derived from Ed25519 public key (multibase) |
| **did:web** | DID method tied to HTTPS domain |
| **JWT-VC** | Verifiable Credential encoded as a signed JWT |
| **NID** | National ID (e.g. Fayda / FIN) |
| **Holder** | Person who receives and stores credentials |
| **Issuer** | Organization that issues credentials |
| **Verifier** | Organization or service that checks credentials |
| **Admin** | Platform operator |
| **Status list** | W3C Bitstring Status List for revocation |
| **Trust registry** | Issuer accreditation and credential-type authorization |
| **Sync token** | Long-lived mobile token for offline sync (not JWT) |

### 1.4 References

- W3C Verifiable Credentials Data Model v1.1 — `https://www.w3.org/2018/credentials/v1`
- W3C DID Core — `https://www.w3.org/TR/did-core/`
- W3C Bitstring Status List — `https://www.w3.org/TR/vc-bitstring-status-list/`
- did:key method — `https://w3c-ccg.github.io/did-method-key/`
- Project: `readme.md`, `docs/portal-flows.md`, `docs/API_SOURCE_OF_TRUTH.md`
- OpenAPI schema: `GET /api/schema/` (drf-spectacular)

### 1.5 Document Overview

Section 2 describes the product at a high level. Sections 3–4 cover architecture and actors. Section 5 is the core functional specification by module. Sections 6–11 cover interfaces, data, quality attributes, security, standards, and constraints.

---

## 2. Overall Description

### 2.1 Product Perspective

The Digital Credential Wallet replaces paper-based credential workflows with cryptographically signed digital credentials that are:

- **Tamper-evident** — Ed25519-signed JWT VCs
- **Revocable** — Bitstring status lists and issuer revocation APIs
- **Holder-controlled** — Credentials bound to wallets; selective sharing via links and presentations
- **Verifiable in real time** — Signature, issuer DID, trust registry, and revocation checks

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Web Portals     │     │  Mobile Wallet   │     │  Public / NID    │
│  Admin/Issuer/   │     │  (Holder)        │     │  Verify / NID    │
│  Verifier/Holder │     │                  │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │ HTTPS / REST
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │              Backend API (Django + DRF)               │
         │  identity │ organizations │ credentials │ verification │
         │  dids │ trust_registry │ audit │ admin_portal        │
         └──────────────────────────┬───────────────────────────┘
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │     PostgreSQL (production) / SQLite (development)   │
         └──────────────────────────────────────────────────────┘
```

### 2.2 Product Functions (Summary)

| # | Function area | Description |
|---|---------------|-------------|
| F1 | Identity & authentication | Users, roles, JWT, holder OTP/NID, mobile sync, wallets, DIDs |
| F2 | Organization management | Issuer/verifier registration, approval, members, settings |
| F3 | Credential lifecycle | Types, schemas, templates, requests, issuance, storage, expiry |
| F4 | Revocation & status | Bitstring status lists, revoke, public status list URL |
| F5 | Presentation & sharing | VP JWT, share tokens, QR, public verify pages |
| F6 | Verification | Rules engine, verifier portal, bulk verify, API keys |
| F7 | Trust registry | Issuer accreditation, credential-type authorization |
| F8 | DID services | Registry DIDs, resolution, publication, key rotation |
| F9 | Audit & admin | Audit logs, admin portal, notifications, system settings |

### 2.3 User Classes

See [Section 4](#4-user-classes-and-characteristics).

### 2.4 Operating Environment

| Layer | Technology |
|-------|------------|
| Server OS | Linux (recommended) |
| Runtime | Python 3.12+, Django 4.2+/6.x |
| API | Django REST Framework, SimpleJWT |
| Web client | React 18+, Vite, TypeScript, Tailwind |
| Mobile | Expo, React Native, TypeScript |
| Database | PostgreSQL 14+ (prod), SQLite (dev) |
| Crypto | Ed25519, PyJWT (EdDSA), Fernet-encrypted keys at rest |

### 2.5 Design and Implementation Constraints

- API base path: `/api/` (except Django admin, static media, OIDC stub)
- Holder mobile uses `EXPO_PUBLIC_API_BASE_URL` (must be set in `.env`)
- Signed credential JWT on `Credential` model is **immutable** after creation
- Trust registry enforcement on issuance is configurable (`TRUST_REGISTRY_ENFORCE_ISSUANCE`)
- Two DID stores: **identity** (wallet-bound) and **dids** (registry); wallet list at `/api/wallet/dids/`, registry at `/api/dids/`

### 2.6 Assumptions and Dependencies

| ID | Assumption |
|----|------------|
| A1 | National ID service provides OTP and profile data (or mock in dev) |
| A2 | Issuers complete organization registration and receive admin approval |
| A3 | TLS terminates at reverse proxy in production |
| A4 | Holders have smartphones capable of running the Expo app |
| A5 | Verifiers and issuers use modern browsers for web portals |

---

## 3. System Context and Architecture

### 3.1 Backend Modules

| Django app | Responsibility |
|------------|----------------|
| `identity` | Users, holder identity, wallets, wallet DIDs, OTP, NID hooks, device auth, sync |
| `organizations` | Issuer/verifier orgs, registration workflow, members, documents, notifications |
| `credentials` | Types, schemas, visual templates, issuance, holder credentials, sharing, status lists |
| `verification` | Verification requests, presentations, results, verifier profile, API keys, bulk |
| `dids` | DID registry (generate, publish, resolve, rotate) |
| `trust_registry` | Issuer accreditation, credential-type authorization |
| `audit` | Audit log API |
| `admin_portal` | Admin-specific APIs and settings |
| `common` | Crypto (Ed25519), JWT service, DID key helpers, parsers |

### 3.2 URL Mounting (Root)

| Prefix | Module |
|--------|--------|
| `/api/dids/` | DID registry ViewSet |
| `/api/` | `identity.urls`, `credentials.urls` |
| `/api/organizations/` | Organization registration and management |
| `/api/verification/` | Verification (singular prefix) |
| `/api/trust-registry/` | Trust registry |
| `/api/audit-logs/` | Audit |
| `/api/admin/` | Admin portal |
| `/api/token/refresh/` | JWT refresh |
| `/api/schema/`, `/api/docs/` | OpenAPI |

### 3.3 Credential Issuance Pipeline (Logical)

```text
Holder request / Issuer direct issue
        │
        ▼
Trust check (accreditation + type auth) [optional enforce]
        │
        ▼
Schema validation (CredentialSchema + claims)
        │
        ▼
Resolve holder DID + wallet
        │
        ▼
Reserve status-list index → build credentialStatus
        │
        ▼
Sign JWT-VC (EdDSA, vc.@context, credentialSubject, credentialStatus)
        │
        ▼
Persist Credential (wallet FK, immutable credential_jwt)
        │
        ▼
Attach status-list entry → deliver via sync / holder APIs
```

### 3.4 Verification Pipeline (Logical)

```text
Verifier submits JWT / presentation / share token / QR scan
        │
        ▼
Verification engine rules (configurable set):
  - DID validation (issuer DID vs organization)
  - Signature verification (org public key, JWT)
  - Revocation (status list + credential.status)
  - Expiry
  - Trust registry (issuer accreditation)
        │
        ▼
Structured pass/fail per rule → stored result / UI display
```

---

## 4. User Classes and Characteristics

### 4.1 System Administrator

| Attribute | Detail |
|-----------|--------|
| **Goals** | Operate platform, approve orgs, monitor compliance |
| **Skills** | Web portal, policy understanding |
| **Auth** | Email/password + JWT; optional 2FA |
| **Portal** | `/admin/*` (frontend) |

### 4.2 Issuer Organization User

| Attribute | Detail |
|-----------|--------|
| **Roles** | Manager, issuer staff (organization member) |
| **Goals** | Define credentials, approve requests, issue and revoke VCs |
| **Auth** | Email/password + JWT |
| **Portal** | `/issuer/*` |

### 4.3 Verifier Organization User

| Attribute | Detail |
|-----------|--------|
| **Goals** | Verify presented credentials, bulk checks, history |
| **Auth** | Email/password + JWT |
| **Portal** | `/verifier/*` |

### 4.4 Holder (Citizen)

| Attribute | Detail |
|-----------|--------|
| **Goals** | Register, store credentials, request new ones, present to verifiers |
| **Auth** | National ID + OTP (mobile); optional web email/password |
| **Clients** | Mobile app (primary), holder web (secondary) |
| **Identity** | Wallet + did:key, sync token for offline sync |

### 4.5 External Systems

| System | Role |
|--------|------|
| **National ID (NID)** | FIN validation, OTP, profile (name, DOB, address, photo) |
| **Public verifiers** | Unauthenticated share/verify endpoints |

---

## 5. Functional Requirements

Requirements use IDs `FR-<module>-<nnn>` for traceability.

### 5.1 Identity and Authentication (`FR-ID`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ID-001 | The system shall support user roles: `holder`, `issuer`, `verifier`, `admin`. | Must |
| FR-ID-002 | Issuer, verifier, and admin shall authenticate via email and password and receive JWT access/refresh tokens. | Must |
| FR-ID-003 | Holder shall register using National ID (FIN) and OTP without requiring email/password on mobile. | Must |
| FR-ID-004 | The system shall normalize National ID input (strip non-digits) before lookup and OTP validation. | Must |
| FR-ID-005 | On holder registration, the system shall create `User`, `HolderIdentity`, `Wallet`, primary `DID` (did:key from Ed25519), and encrypted `DIDKey`. | Must |
| FR-ID-006 | The system shall issue a sync token (hashed at rest) for mobile offline-first synchronization. | Must |
| FR-ID-007 | The system shall expose `GET /api/wallet/dids/` for wallet-bound DIDs (authenticated holder). | Must |
| FR-ID-008 | The system shall support device registration and device-scoped authentication for mobile. | Should |
| FR-ID-009 | The system shall support optional DID-based mobile challenge/response authentication. | Could |
| FR-ID-010 | The system shall support holder web registration (`/api/auth/holder/web/register/`) with email/password. | Should |
| FR-ID-011 | The system shall integrate with NID: initiate, verify OTP, get profile (`/api/nid/*`). | Must |
| FR-ID-012 | OTP for testing shall only be returned in API responses when `DEBUG=True`. | Must |
| FR-ID-013 | The system shall support password reset, change password, and logout for web users. | Should |
| FR-ID-014 | The system shall support two-factor authentication fields on user (TOTP-ready). | Could |

### 5.2 Organizations (`FR-ORG`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORG-001 | Issuer and verifier organizations shall register via multi-step workflow (account, organization, documents, authorization, submission). | Must |
| FR-ORG-002 | Admin shall approve, reject, suspend, or reactivate organizations. | Must |
| FR-ORG-003 | On approval, the system may auto-generate system DIDs and link trust registry accreditation. | Should |
| FR-ORG-004 | Each issuer organization shall have `organization_did`, `public_key`, and encrypted `private_key` for signing VCs. | Must |
| FR-ORG-005 | Organization members shall have roles (e.g. manager, issuer_staff) governing API access. | Must |
| FR-ORG-006 | Issuer shall manage profile, signatories, settings, and notifications. | Should |

### 5.3 Credential Types, Schemas, and Templates (`FR-CT`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CT-001 | Issuer shall create and manage credential types (`jwt_vc`, `sd_jwt` enum; SD-JWT signing is partial). | Must |
| FR-CT-002 | Each credential type shall have versioned `CredentialSchema` with JSON schema and claims validation. | Must |
| FR-CT-003 | Issuer shall manage visual `CredentialTemplate` and `TemplateField` for card/PDF/SVG rendering. | Must |
| FR-CT-004 | Legacy issuer templates shall remain available at `/api/issuer/templates-legacy/`. | Should |
| FR-CT-005 | Credential types shall support `render_metadata` (colors, icons, SVG templates). | Should |

### 5.4 Credential Requests and Issuance (`FR-ISS`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ISS-001 | Holder shall browse request catalog and submit credential requests. | Must |
| FR-ISS-002 | Issuer shall list, approve, or reject requests. | Must |
| FR-ISS-003 | Issuer shall issue credentials via `POST /api/issuer/credentials/issue/`. | Must |
| FR-ISS-004 | Issuer shall look up holder by National ID via `GET /api/issuer/holder-lookup/`. | Must |
| FR-ISS-005 | Issuance shall validate claims against active schema and bind credential to holder wallet. | Must |
| FR-ISS-006 | Issued VC shall use JWT format with `vc.@context` v1, `type`, `issuer`, `credentialSubject`, dates. | Must |
| FR-ISS-007 | Issued VC shall include `credentialStatus` (StatusList2021Entry) with reserved index. | Must |
| FR-ISS-008 | Issuer shall issue from template: single, bulk validate, bulk issue (`/api/issuer/templates/{id}/...`). | Must |
| FR-ISS-009 | Issuer shall list, view, revoke issued credentials. | Must |
| FR-ISS-010 | When `TRUST_REGISTRY_ENFORCE_ISSUANCE` is true, issuance shall require valid issuer accreditation and type authorization. | Must |
| FR-ISS-011 | Signed `credential_jwt` shall not be modifiable after save. | Must |

### 5.5 Holder Credential Management (`FR-HLD`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HLD-001 | Holder shall list credentials via `GET /api/holder/my-credentials/`. | Must |
| FR-HLD-002 | Holder shall view credential detail, download, and verification activity. | Should |
| FR-HLD-003 | Mobile shall sync credentials via `/api/sync/` using sync token. | Must |
| FR-HLD-004 | Holder shall enable/disable sharing and obtain share links. | Must |
| FR-HLD-005 | Public shall access shared credential via `/api/share/{token}/` (read, verify, QR). | Must |
| FR-HLD-006 | Display endpoints shall provide holder-friendly views without exposing raw JWT unnecessarily. | Should |

### 5.6 Revocation and Status Lists (`FR-REV`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REV-001 | The system shall maintain W3C bitstring status lists per issuer DID and credential type. | Must |
| FR-REV-002 | Revocation shall set status list bit and update credential status to `revoked`. | Must |
| FR-REV-003 | Public status list credential shall be available at `GET /api/status-lists/{uuid}/`. | Must |
| FR-REV-004 | Verification shall consult revocation status before reporting valid. | Must |

### 5.7 Presentation and Verification (`FR-VER`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VER-001 | Holder shall create verifiable presentations (VP JWT, EdDSA). | Must |
| FR-VER-002 | Verifier shall submit verification requests and receive structured results. | Must |
| FR-VER-003 | Verification engine shall evaluate: DID match, signature, revocation, expiry, trust. | Must |
| FR-VER-004 | Verifier shall support holder-initiated QR flows (`/verify/p/{uuid}` style links). | Must |
| FR-VER-005 | Verifier shall support bulk verification and API keys for automation. | Should |
| FR-VER-006 | Public verify pages shall display verification outcome for shared credentials. | Should |

### 5.8 DID Management (`FR-DID`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DID-001 | Admin/registry shall generate issuer DIDs (`did:web`, `did:ion`) and holder registry DIDs (`did:key`). | Must |
| FR-DID-002 | Wallet holder DIDs shall be W3C-compliant `did:key` derived from Ed25519 public key. | Must |
| FR-DID-003 | `GET /api/dids/{did}/resolve/` shall resolve registry, wallet, and organization issuer DIDs. | Must |
| FR-DID-004 | `GET /api/dids/{did}/public_key/` shall return verification keys when resolvable. | Must |
| FR-DID-005 | DID documents shall support publication and key rotation events (registry). | Should |

### 5.9 Trust Registry (`FR-TR`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TR-001 | Admin shall manage issuer accreditations (pending, approved, suspended, revoked). | Must |
| FR-TR-002 | Admin shall authorize which credential types an issuer may issue. | Must |
| FR-TR-003 | Verification may consider trust registry status for issuer legitimacy. | Should |

### 5.10 Audit and Admin Portal (`FR-ADM`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-001 | The system shall record audit events for security-relevant actions. | Must |
| FR-ADM-002 | Admin shall query audit logs via `/api/audit-logs/`. | Must |
| FR-ADM-003 | Admin portal shall manage users, organizations, DIDs, trust registry, notifications. | Must |
| FR-ADM-004 | OpenAPI schema shall be generated for contract testing (`/api/schema/`). | Should |

### 5.11 Mobile Application (`FR-MOB`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MOB-001 | Mobile app shall require `EXPO_PUBLIC_API_BASE_URL` at build/runtime. | Must |
| FR-MOB-002 | Mobile shall verify credential JWTs using platform DID resolver (did:key local + API resolve). | Must |
| FR-MOB-003 | Mobile shall support offline credential storage and queue sync when online. | Must |
| FR-MOB-004 | Mobile shall support PIN/biometric app lock after initial registration. | Should |
| FR-MOB-005 | Mobile shall scan verifier QR codes and submit presentations. | Must |
| FR-MOB-006 | Mobile shall check revocation before sharing credentials. | Should |

### 5.12 Web Frontend (`FR-WEB`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WEB-001 | Frontend shall use API base `VITE_API_URL` (default `http://localhost:8000/api`). | Must |
| FR-WEB-002 | Issuer API calls shall use `/api/issuer/...` paths (not legacy `/credentials/issuer/...`). | Must |
| FR-WEB-003 | Portals shall be separated: admin, issuer, verifier, holder layouts. | Must |
| FR-WEB-004 | Public pages shall support credential verification without login. | Should |

---

## 6. External Interface Requirements

### 6.1 User Interfaces

| UI | Technology | Primary users |
|----|------------|---------------|
| Admin portal | React, Tailwind | Admin |
| Issuer portal | React | Issuer staff |
| Verifier portal | React | Verifier staff |
| Holder web | React | Holder |
| Holder mobile | Expo RN | Holder |
| Public verify | React | Anonymous verifier |
| Django admin | Django templates | Technical admin |

### 6.2 Hardware Interfaces

- Mobile: camera for QR scan, secure storage for keys/tokens
- Server: standard x86/ARM Linux hosting

### 6.3 Software Interfaces

| Interface | Protocol | Notes |
|-----------|----------|-------|
| Client ↔ API | HTTPS, JSON, JWT Bearer | CORS enabled for web |
| Mobile sync | HTTPS + sync token header/body | See mobile API docs |
| NID service | REST (project-specific) | Mock in `test_integration/` |
| OIDC discovery stub | `/.well-known/openid-configuration` | Minimal metadata |

### 6.4 Communication Interfaces

- REST over TLS 1.2+
- JWT access token lifetime per SimpleJWT settings
- Refresh via `POST /api/token/refresh/`

### 6.5 Primary API Groups (Contract Summary)

**Identity** (`/api/`)

- `POST /api/auth/login/`, logout, password flows
- `POST /api/auth/holder/request-otp/`, `register/`, `web/register/`
- `GET /api/wallets/`, `POST /api/wallets/create/`, `GET /api/wallet/dids/`
- `POST /api/sync/`, `POST /api/auth/device/`
- `POST /api/nid/initiate/`, `verify/`, `get-profile/`

**Credentials** (`/api/`)

- Issuer: `/api/issuer/credential-types/`, `templates/`, `credentials/issue/`, `requests/`, `issuance/`, `stats/`
- Holder: `/api/holder/my-credentials/`, `requests/`, `sharing/*`
- Public: `/api/share/{token}/`, `/api/status-lists/{id}/`
- OID4VCI stubs: `/api/credentials/oid4vci/...`

**Verification** (`/api/verification/`)

- Requests, presentations, results, public verify, verifier profile, bulk, API keys

**Organizations** (`/api/organizations/`)

- Registration steps, admin org management, members

**DIDs** (`/api/dids/`)

- CRUD, `generate_issuer`, `generate_holder`, `resolve`, `publish`, `public_key`

**Trust registry** (`/api/trust-registry/`)

- Accreditations, type authorizations

**Audit** (`/api/audit-logs/`)

---

## 7. Data Requirements

### 7.1 Core Entities

| Entity | Description | Key relationships |
|--------|-------------|-------------------|
| `User` | Platform account (role, NID, sync_token) | 1:N wallets, org membership |
| `HolderIdentity` | NID profile cache | 1:1 User (holder) |
| `Wallet` | Credential container per device/user | 1:N DIDs, 1:N Credentials |
| `DID` (identity) | Wallet-bound did:key | 1:N DIDKey |
| `Organization` | Issuer or verifier org | 1:1 accreditation, keys, members |
| `CredentialType` | VC template definition | Schemas, templates, status lists |
| `Credential` | Issued VC record + immutable JWT | Wallet, org, type, status list entry |
| `CredentialRequest` | Holder → issuer request | User, type, status workflow |
| `StatusList` / `StatusListEntry` | Revocation bitstring | Per issuer/type |
| `DID` (dids app) | Registry DID + document | Org or user owner |
| `IssuerAccreditation` | Trust registry | Organization |
| `VerificationRequest` / `Presentation` | Verification workflow | Verifier, holder, credentials |

### 7.2 Data Integrity Rules

- UUID primary keys for major entities
- Unique: `User.email`, `User.national_id`, `Credential.share_token`, status list (issuer, type, version)
- `Credential.credential_jwt` immutable after insert
- Foreign keys: PROTECT/CASCADE per domain (org, wallet)

### 7.3 Retention and Backup

- Audit logs retained per organizational policy (not hard-coded in code)
- Media uploads (registration documents) stored under `MEDIA_ROOT`
- Database backups: operational requirement (PostgreSQL pg_dump / managed service)

---

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-P-001 | API shall respond to typical CRUD operations within 2 s under normal load (target). |
| NFR-P-002 | Verification of a single JWT shall complete within 5 s including DID resolution. |
| NFR-P-003 | Mobile sync shall support incremental fetch of new credentials. |

### 8.2 Availability

| ID | Requirement |
|----|-------------|
| NFR-A-001 | Production deployment target: 99.5% uptime (excluding planned maintenance). |
| NFR-A-002 | Mobile app shall remain usable offline for viewing stored credentials. |

### 8.3 Scalability

| ID | Requirement |
|----|-------------|
| NFR-S-001 | Architecture shall allow horizontal scaling of stateless API workers (Gunicorn). |
| NFR-S-002 | Status lists support up to 131,072 credentials per list (16 KB bitstring). |

### 8.4 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-M-001 | OpenAPI schema shall be the contract source of truth. |
| NFR-M-002 | Backend tests shall cover crypto, lifecycle, wallet binding, trust registry. |

### 8.5 Usability

| ID | Requirement |
|----|-------------|
| NFR-U-001 | Holder registration shall complete in ≤ 5 steps on mobile. |
| NFR-U-002 | Verification results shall show per-rule success/failure messages. |
| NFR-U-003 | Web portals shall use consistent layout components per role. |

### 8.6 Portability

| ID | Requirement |
|----|-------------|
| NFR-PO-001 | Mobile app shall run on Android and iOS via Expo. |
| NFR-PO-002 | Backend shall run on Linux with SQLite (dev) or PostgreSQL (prod). |

---

## 9. Security and Privacy Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-001 | All production traffic shall use HTTPS. | Must |
| SEC-002 | Passwords shall use Django’s password hashers (PBKDF2/Argon2). | Must |
| SEC-003 | Private keys shall be encrypted at rest (Fernet / org settings). | Must |
| SEC-004 | JWT access tokens shall be validated on protected endpoints. | Must |
| SEC-005 | Role-based access shall restrict issuer/verifier/admin APIs. | Must |
| SEC-006 | Holders shall only access their own wallets and credentials. | Must |
| SEC-007 | Share tokens shall be unguessable (cryptographic random). | Must |
| SEC-008 | Sync tokens shall be stored hashed server-side. | Must |
| SEC-009 | Audit trail shall capture privileged actions. | Must |
| SEC-010 | PII from NID shall only be used for identity and credential claims. | Must |
| SEC-011 | Rate limiting should be applied to OTP and login endpoints (django-ratelimit available). | Should |

---

## 10. Standards and Interoperability

### 10.1 Implemented

| Standard | Implementation |
|----------|----------------|
| W3C VC Data Model (JWT) | `vc` claim with `@context` `https://www.w3.org/2018/credentials/v1` |
| Ed25519 signatures | JWT `alg: EdDSA` |
| did:key (holders) | Multicodec Ed25519 in `common/did_key.py` |
| did:web (issuers) | Organization `organization_did` + resolve via org public key |
| StatusList2021 | `credentialStatus` in VC + public bitstring endpoint |
| VP JWT | `typ: VP`, `verifiableCredential` array |

### 10.2 Partial / Planned

| Standard | Status |
|----------|--------|
| SD-JWT | Enum and flag only; no full selective disclosure |
| OID4VCI | Metadata/JWKS endpoints; not full protocol |
| JSON-LD / LDP-VC | UI option only; not implemented |
| Single DID registry | Two models (identity + dids); merge planned |

---

## 11. Constraints and Assumptions

### 11.1 Regulatory / Business

- Platform may operate under national digital identity policy (e.g. Ethiopia Fayda integration).
- Only accredited issuers may issue certain credential types when enforcement is on.

### 11.2 Technical

- Django `SECRET_KEY` required; production must not use default insecure key.
- `API_PUBLIC_BASE_URL` must match deployed API host for valid status list URLs in VCs.
- Frontend and mobile must align API paths with backend (`/api/issuer/...`).

### 11.3 Known Limitations (Current Release)

1. Duplicate DID subsystems (wallet vs registry).  
2. SD-JWT and OID4VCI not production-complete.  
3. Some README API paths are outdated; prefer OpenAPI schema.  
4. Expired JWT verification logs warning in tests.

---

## 12. Future Enhancements

| Priority | Enhancement |
|----------|-------------|
| High | Unify DID models into single service |
| High | Complete OID4VCI / OID4VP for wallet interop |
| Medium | Full SD-JWT selective disclosure |
| Medium | JSON-LD credentials and multiple proof types |
| Low | Redis/Celery for async bulk issuance and notifications |
| Low | HSM integration for issuer signing keys |

---

## 13. Appendices

### Appendix A — Use Case Summary

| UC ID | Name | Actor | Summary |
|-------|------|-------|---------|
| UC-01 | Register holder (mobile) | Holder | NID + OTP → wallet + DID |
| UC-02 | Register organization | Issuer/Verifier | Multi-step → admin approval |
| UC-03 | Request credential | Holder | Catalog → request → issuer review |
| UC-04 | Issue credential | Issuer | Validate → sign JWT VC → bind wallet |
| UC-05 | Sync credentials | Holder | Mobile pull new VCs |
| UC-06 | Share credential | Holder | Enable share link / QR |
| UC-07 | Verify credential | Verifier | Rules engine → result |
| UC-08 | Revoke credential | Issuer | Status list + status revoked |
| UC-09 | Manage trust registry | Admin | Accredit issuers and types |
| UC-10 | Resolve DID | System/Client | API resolve for verification |

### Appendix B — Verification Engine Rules (Reference)

| Rule name | Purpose |
|-----------|---------|
| `did_validation` | Issuer DID in VC matches organization record |
| `signature_verification` | Ed25519 JWT signature valid |
| `revocation_check` | Status list and credential status |
| `expiry_check` | `exp` / `expirationDate` |
| Trust-related checks | Accreditation and authorization |

### Appendix C — Environment Variables (Reference)

| Variable | Purpose |
|----------|---------|
| `DJANGO_ENV` | `development` / `production` |
| `SECRET_KEY` | Django secret |
| `TRUST_REGISTRY_ENFORCE_ISSUANCE` | `true`/`false` |
| `API_PUBLIC_BASE_URL` | Status list URLs in VCs |
| `VITE_API_URL` | Frontend API base |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile API base |

### Appendix D — Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-23 | Generated from codebase | Initial SRS from project analysis |

---

*End of Software Requirements Specification*
