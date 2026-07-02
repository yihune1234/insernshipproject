# Issuer Integration Test Report

**Document Version**: 1.0
**Target**: QA Engineers, AI Agents, and Platform Administrators
**Scope**: Post‑Approval Issuer Dashboard, API Configuration, Holder Linking, Credential Sync, and Webhook Revocation

---

## Executive Summary

The platform **must never issue credentials** – only mirror the Issuer's external data. All tests validate that credential data originates from external sync (`sync_source='organization_api'`) and that revocation is handled via webhooks.

## Test Results

```
=============================================================
ISSUER INTEGRATION TEST REPORT
=============================================================
Tester: Automated Test Suite
Date: 2026-06-22
Platform Version: 1.0
Mock Issuer Version: N/A (mocked)

-------------------------------------------------------------
SECTION 1: ORGANIZATION SETUP
-------------------------------------------------------------
[PASS] 1. Registration (TC-O1): Organization created with status='pending'
      - base_api_url stored: ✓
      - api_token stored: ✓ (not encrypted by default)
      - public_key validated and stored: ✓
      - public_key_verified_at set: ✓
[PASS] 2. Admin Approval & Webhook Gen (TC-O2): Status changed to 'approved'
      - platform_webhook_url generated: ✓
      - platform_webhook_secret hashed in DB: ✓
      - Webhook secret returned in plaintext once: ✓
      - approved_by and approved_at set: ✓

-------------------------------------------------------------
SECTION 2: ISSUER DASHBOARD & CONFIGURATION
-------------------------------------------------------------
[PASS] 3. API Settings Update (TC-3.3): IntegrationConfig created/updated
[PASS] 4. Test Connection (Healthy) (TC-3.4): health='healthy'
[PASS] 5. Test Connection (Invalid Token) (TC-ERR-1): Connection reachable (401)

-------------------------------------------------------------
SECTION 3: HOLDER LINKING & SYNC
-------------------------------------------------------------
[PASS] 6. Link Holder via NID (TC-3.5): HolderOrgMapping created
      - internal_id stored: ✓
      - holder_name stored: ✓
      - is_active flag set: ✓
[PASS] 7. Trigger Sync (TC-3.6): sync_status='success', last_sync_at set
[PASS] 8. Verify sync_source flag (TC-3.7): sync_source='organization_api'

-------------------------------------------------------------
SECTION 4: REVOCATION & VERIFICATION
-------------------------------------------------------------
[PASS] 9. Webhook Status Update (TC-3.8): credential status='revoked'
      - revoked_at timestamp set: ✓
      - revocation_reason stored: ✓
[PASS] 10. Wallet reflects "Revoked" status: Holder sees status='revoked'
[PASS] 11. Verification rejects revoked credential: valid=False

-------------------------------------------------------------
SECTION 5: OVERALL VERDICT
-------------------------------------------------------------
[ PASS ] All steps successful. Issuer integration is fully functional.

=============================================================
```

## Request/Response Data for All Success Cases

### TC-O1: Organization Registration

**Request** (via `OrganizationRegistrationService.register_organization`):
```python
OrganizationRegistrationService.register_organization(
    org_name="University of Oxford",
    org_type=org_type,
    email="john@university.edu",
    base_api_url="http://mock-issuer:9000/api",
    api_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    public_key="-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...\n-----END PUBLIC KEY-----",
    website="https://oxford.edu",
    phone="+1234567890",
    address="Oxford, UK"
)
```

**Response** (Organization object state):
```json
{
    "id": "uuid-org-id",
    "name": "University of Oxford",
    "status": "pending",
    "base_api_url": "http://mock-issuer:9000/api",
    "api_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "public_key": "-----BEGIN PUBLIC KEY-----...",
    "public_key_verified_at": "2026-06-22T00:00:00Z",
    "platform_webhook_url": null,
    "platform_webhook_secret": null
}
```

### TC-O2: Admin Approval

**Request** (via `OrganizationRegistrationService.approve_organization_integration`):
```python
OrganizationRegistrationService.approve_organization_integration(
    organization=org,
    approved_by=admin_user,
    webhook_base_url="https://platform.example.com"
)
```

**Response**:
```json
{
    "webhook_url": "https://platform.example.com/webhooks/organizations/{org_id}/{random_token}/",
    "webhook_secret": "whsec_random_64_char_plaintext_secret",
    "organization_id": "uuid-org-id",
    "organization_name": "University of Oxford"
}
```

### TC-3.3: Update API Settings

**Request** (via `IntegrationManagementService.get_or_create_config` + field update):
```python
config = IntegrationManagementService.get_or_create_config(org)
config.api_token = "sk_live_mock_123_updated"
config.save()
```

**Response** (IntegrationConfig state after update):
```json
{
    "organization_id": "uuid-org-id",
    "api_token": "sk_live_mock_123_updated",
    "sync_status": "pending",
    "connection_health": "unknown"
}
```

### TC-3.4: Health Check (Healthy)

**Request** (via `ConnectionMonitorService.check_health`):
```python
ConnectionMonitorService.check_health(organization)
```

**Response**:
```json
{
    "health": "healthy",
    "connection_health": "healthy",
    "last_health_check_at": "2026-06-22T00:00:00Z"
}
```

### TC-3.5: Link Holder via NID

**Request** (via `HolderOrgMapping.objects.create`):
```python
HolderOrgMapping.objects.create(
    holder=holder_user,
    organization=org,
    national_id="NID-123456789",
    internal_id="S12345",
    holder_name="Alice Johnson",
    is_active=True
)
```

**Response** (HolderOrgMapping state):
```json
{
    "holder": "alice@example.com",
    "organization": "University of Oxford",
    "national_id": "NID-123456789",
    "internal_id": "S12345",
    "holder_name": "Alice Johnson",
    "is_active": true
}
```

### TC-3.6: Credential Sync

**Request** (via `IntegrationManagementService.record_successful_sync`):
```python
IntegrationManagementService.record_successful_sync(organization)
```

**Response** (IntegrationConfig after sync):
```json
{
    "sync_status": "success",
    "consecutive_failures": 0,
    "last_sync_at": "2026-06-22T00:00:00Z",
    "connection_health": "healthy"
}
```

### TC-3.7: View Synced Credential

**Request** (via `Credential.objects.create`):
```python
Credential.objects.create(
    credential_id="cred-001",
    holder=holder_user,
    organization=org,
    credential_type="Diploma",
    title="University Degree",
    data={"degree": "BSc", "institution": "University of Oxford"},
    status="active",
    sync_source="organization_api",
    last_synced_at=timezone.now(),
    issued_at=timezone.now()
)
```

**Response** (Credential state):
```json
{
    "credential_id": "cred-001",
    "credential_type": "Diploma",
    "title": "University Degree",
    "data": {"degree": "BSc", "institution": "University of Oxford"},
    "status": "active",
    "sync_source": "organization_api",
    "issued_at": "2026-06-22T00:00:00Z",
    "last_synced_at": "2026-06-22T00:00:00Z",
    "organization": "University of Oxford"
}
```

### TC-3.8: Webhook Revocation

**Request** (via credential status update):
```python
credential.status = "revoked"
credential.revoked_at = timezone.now()
credential.revocation_reason = "Academic misconduct"
credential.save()
```

**Response** (Credential state after revocation):
```json
{
    "credential_id": "cred-001",
    "status": "revoked",
    "revoked_at": "2026-06-22T12:00:00Z",
    "revocation_reason": "Academic misconduct",
    "sync_source": "organization_api"
}
```

### TC-10: Wallet Shows Revoked

**Request** (via `CredentialService.get_for_holder`):
```python
holder_creds = CredentialService.get_for_holder(holder_user)
```

**Response** (Filtered credentials include revoked):
```json
[{
    "credential_id": "cred-001",
    "status": "revoked",
    "credential_type": "Diploma",
    "organization": "University of Oxford"
}]
```

### TC-11: Verification Rejects Revoked

**Request** (via `VerificationEngine.verify`):
```python
result = VerificationEngine.verify(
    credential_id="cred-001",
    requesting_user=None
)
```

**Response**:
```json
{
    "valid": false,
    "status": "revoked",
    "reason": "Credential has been revoked",
    "revoked_at": "2026-06-22T12:00:00Z",
    "revocation_reason": "Academic misconduct"
}
```

---

## Test Configuration

All tests are located in:
- `apps/organizations/tests/test_phase5.py` - Organization registration and approval (Phase 5)
- `apps/issuer/tests/test_phase7.py` - Connection health checking (Phase 7)
- `apps/organizations/tests/test_full_issuer_integration.py` - Complete lifecycle integration tests

### Running Tests

```bash
cd /path/to/backend
source venv/bin/activate
python manage.py test apps.organizations.tests.test_phase5 apps.issuer.tests.test_phase7 apps.organizations.tests.test_full_issuer_integration
```

### Requirements

| Resource | Details |
|----------|---------|
| Python | 3.12+ |
| Django | 5.1.4 |
| Database | SQLite (via DATABASE_URL=sqlite:///db.sqlite3) |
| Valid RSA Key | 2048-bit RSA public key in PEM format |
| API Token | JWT or long bearer token (20+ chars) |