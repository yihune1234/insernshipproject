# System Documentation

This folder contains reference documentation for the Digital Credential Wallet system, including how the platform works, its main portals, and the end-to-end user flows.

## Contents

- **`PROJECT_COMPLETE_FLOWS.md`** — **Master reference:** all end-to-end flows (backend APIs, web routes, mobile routes, models, scenarios). Start here for the full picture.
- `portal-flows.md` — High-level portal and actor behavior (Admin, Issuer, Holder, Verifier).
- `API_SOURCE_OF_TRUTH.md` — API contract reference.
- `SRS.md` — Software requirements specification.
- `reports/` — Module analysis reports (backend, frontend, mobile).

## About the System

The Digital Credential Wallet is a multi-platform ecosystem designed to enable trusted, verifiable digital credentials between organizations and individuals.

Key capabilities include:

- Issuing digital credentials from trusted organizations
- Securely storing credentials in a holder wallet
- Presenting credentials selectively to verifiers
- Verifying credential authenticity and revocation status
- Managing users, organizations, and audit trails from an admin portal

## Main Portals

The system includes four primary portals:

1. **Admin Portal**
   - System-wide configuration and governance
   - Manage organizations, users, issuers, and verifiers
   - Audit logs and operational oversight

2. **Issuer Portal**
   - Create and manage credential templates and credential types
   - Review and approve credential requests from holders
   - Issue credentials that holders can store in their wallet
   - Revoke credentials when needed

3. **Holder Wallet**
   - Register and authenticate as a holder
   - Browse credential requests and request new credentials
   - Store credentials securely on the device
   - Present credentials to verifiers when needed

4. **Verifier Portal**
   - Receive credential presentations from holders
   - Verify credential validity and revocation status
   - Review verification histories and audit details

## How to Use This Folder

- Start with **`PROJECT_COMPLETE_FLOWS.md`** for complete step-by-step flows across backend, web, and mobile.
- Use `portal-flows.md` for a shorter actor-focused overview.
- Use these docs as a quick reference when exploring the codebase or onboarding new contributors.
