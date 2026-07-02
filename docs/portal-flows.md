# Portal Flows and System Behavior

This document describes the main actors in the Digital Credential Wallet system and the behavior of each portal.

## Actors and Roles

### 1. Admin

The Admin is the system operator who manages the overall environment.

Responsibilities:

- Register and manage issuer organizations
- Register and manage verifier organizations
- Manage users and role assignments
- Monitor audit logs and system health
- Configure system settings and access controls

How it works:

- Admins authenticate through the web portal using email/password.
- Admin actions are recorded in audit logs for traceability.
- Admins can approve or reject issuer/verifier registrations.

### 2. Issuer

The Issuer is the organization that creates and issues credentials.

Responsibilities:

- Define credential types and templates
- Accept or reject holder credential requests
- Issue credentials to holders
- Revoke credentials that are no longer valid
- View issuance statistics and reports

How it works:

- Issuers sign in to the issuer portal using email/password.
- They use the system to create credential definitions and templates.
- Holders submit requests for credentials; issuers review these requests.
- When approved, the issuer issues a signed credential that the holder can store.
- Issuers can revoke credentials based on policy or lifecycle events.

### 3. Holder

The Holder is the individual who receives, stores, and presents credentials.

Responsibilities:

- Register and authenticate as a holder
- Request credentials from issuers
- Store credentials securely in the mobile wallet
- Present credentials to verifiers when required
- Track credential status and history

How it works:

- Holders typically register via mobile wallet using OTP or national ID flows.
- The holder wallet stores credentials and manages the holder's identity.
- Holders can browse credential request catalogs and make requests.
- Once a credential is issued, the holder keeps it in the wallet for later presentation.

### 4. Verifier

The Verifier checks the credentials presented by holders.

Responsibilities:

- Submit credentials for verification
- Confirm credential authenticity and status
- See verification results and audit history
- Support bulk or individual verification workflows

How it works:

- Verifiers authenticate using email/password on the web portal.
- They request credential presentations or receive scanned QR data from holders.
- The system checks the credential against issuer records and revocation status.
- The verifier receives a result, including whether the credential is valid.

## End-to-End Flow

### 1. System Setup

- Admin registers issuer and verifier organizations.
- Admin configures any required system-level settings.
- Issuer creates credential types, templates, and issuance rules.

### 2. Holder Registration and Request

1. Holder registers through the mobile app.
2. Holder logs in and sees credential options.
3. Holder requests a credential from an issuer.
4. The system sends a request to issuer review.

### 3. Issuance

1. Issuer reviews the holder request.
2. Issuer approves or rejects the request.
3. If approved, the system issues a signed credential.
4. Credential is delivered to the holder wallet.

### 4. Presentation and Verification

1. Holder selects a credential to present.
2. Holder sends credential data to a verifier.
3. Verifier portal checks the credential details.
4. System validates authenticity, integrity, and revocation status.
5. Verifier sees the verification decision.

### 5. Revocation and Audit

- Issuers can revoke credentials when needed.
- Verification always checks current revocation state.
- Admins and verifiers can view audit logs for compliance.

## Common System Paths

### Issuer path

- Create template → review requests → issue credential → manage status

### Holder path

- Register → request credential → receive credential → present to verifier

### Verifier path

- Login → submit credential presentation → receive verification result

### Admin path

- Manage organizations → approve entities → monitor activity

## Why the system is useful

- It reduces paper-based credential workflows.
- It gives holders control over their digital credentials.
- It provides issuers a secure means to publish verifiable claims.
- It allows verifiers to confirm credibility without manual checks.
- It supports traceability through audit logs and status checks.
