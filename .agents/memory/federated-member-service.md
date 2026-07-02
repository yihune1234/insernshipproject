---
name: Federated Member Service
description: Architecture and gotchas for the per-org external member API integration
---

## Rule
Every credential issuance must pass through the issuer org's external member API via FederatedMemberService before the credential is created.

## Architecture
- `IssuerApiConfig` (db_table=`issuer_api_configs`) stores per-org config: `api_base_url`, `member_verify_endpoint`, `api_key_header`, `api_key_value`, `request_id_field`, `response_eligibility_field`, `response_name_field`, `field_mappings` (JSON array of `{response_path, credential_field}`), `last_test_status` (untested/success/failed), `last_test_error`, `last_tested_at`.
- `FederatedMemberService` in `backend/apps/issuer/services/federated_member_service.py` exposes two methods:
  - `verify_member(org, member_identifier, actor)` — raises on any failure; returns `MemberVerificationResult`
  - `test_connection(org, test_member_id)` — never raises; returns `TestConnectionResult` with `fields_found` + `mapped_claims`
- Exception hierarchy (all subclass `FederatedVerificationError`): `ApiConfigNotFoundException`, `ApiConfigNotTestedException`, `MemberNotEligibleException`, `MemberApiTimeoutException`, `MemberApiErrorException`, `MemberApiInvalidResponseException`, `MemberApiUnreachableException`.

## Dot-notation
`_resolve_dot_path("data.member.status", response_dict)` safely traverses nested JSON. Returns `None` if any key is absent.

## Eligibility values
`_truthy()` treats `true / 1 / yes / active / valid / eligible` (case-insensitive) as eligible.

## Pending Delivery
- `PendingCredential` model in `credentials/models/pending_credential.py`, db_table=`pending_credentials`.
- `credentials/signals.py` has `post_save` on `NIDVerification` → calls `_deliver_for_user` which matches pending credentials by NID FIN.
- `credentials/apps.py` calls `_connect_signals()` in `ready()`.

## Mock Org API
- `mock_org_api/server.js` — Express on port 3001
- Endpoints: `POST /api/members/verify` (basic), `POST /verify-extended` (with extra fields)
- API key header: `X-API-Key: mock-api-key-2024`
- Request field: `member_id`
- Response eligibility path: `data.is_active`
- Active member IDs: MEM001–MEM006, MEM008–MEM009; inactive: MEM007, MEM010–MEM012

## Frontend nav
- IssuerLayout nav item "Pending Delivery" → `/issuer/pending-credentials` (icon: Users)
- IssuerLayout nav item "Member API" → `/issuer/api-config` (icon: Plug)
- Issue Credential button is disabled until `memberInfo?.found === true` (member must be verified first)

**Why:** Prevents issuing credentials to ineligible members; catches connectivity issues before issuance; auto-delivery closes the gap for members who register after their credential is issued.

**How to apply:** Any new issuance path (manual, bulk, API) must call `FederatedMemberService.verify_member` and handle all 7 exception types with distinct UI messages.
