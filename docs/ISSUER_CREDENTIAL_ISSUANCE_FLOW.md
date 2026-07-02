# Issuer Credential Issuance Flow — Complete Analysis

## 1. Overview

This document maps the complete **Issuer Credential Issuance Flow** — from organization registration, integration setup, member verification, credential issuance (single & bulk), status management, sync, analytics, to notifications. Every file, module, app, and endpoint is documented.

---

## 2. App Structure Overview

### 2.1 Backend Apps Involved

| App | Path | Purpose |
|-----|------|---------|
| `apps.issuer` | `backend/apps/issuer/` | Issuer-specific views, models, serializers, services |
| `apps.credentials` | `backend/apps/credentials/` | Credential model, creation, sync services |
| `apps.organizations` | `backend/apps/organizations/` | Organization + member models |
| `apps.notifications` | `backend/apps/notifications/` | Notification system |
| `apps.trust_registry` | `backend/apps/trust_registry/` | Trust status checks |
| `common` | `backend/common/` | Shared response helpers, permissions |

### 2.2 Frontend Issuer Module

| Path | Purpose |
|------|---------|
| `frontend/src/pages/issuer/` | 6 pages: Dashboard, Integrations, Sync, Analytics, Notifications, Settings |
| `frontend/src/api/issuer.js` | All issuer API calls |
| `frontend/src/hooks/useNotifications.js` | Notification polling |
| `frontend/src/hooks/useSSENotifications.js` | SSE real-time updates |

---

## 3. URL Routing

### 3.1 Root URLs (`backend/config/urls.py`)

```python
path("api/v1/integration/", include("apps.issuer.urls")),         # All issuer endpoints
path("api/v1/notifications/", include("apps.notifications.urls")), # Notifications
path("api/v1/organizations/", include("apps.organizations.urls")), # Organizations
path("api/v1/credentials/", include("apps.credentials.urls")),     # Credentials
path("api/v1/trust/", include("apps.trust_registry.urls")),        # Trust registry
```

### 3.2 Issuer URLs (`backend/apps/issuer/urls.py`)

| URL Pattern | View Class | File | Description |
|-------------|------------|------|-------------|
| `organization/` | `IssuerOrganizationView` | `views/organization.py` | GET/PUT org profile |
| `organization/members/` | `IssuerOrgMemberView` | `views/organization.py` | GET/POST team members |
| `organization/members/<uuid:user_id>/` | `IssuerOrgMemberDetailView` | `views/organization.py` | DELETE/PATCH member |
| `notifications/unread-count/` | `IssuerUnreadCountView` | `notifications/views/issuer.py` | Unread count |
| `notifications/stream/` | `IssuerNotificationStreamView` | `notifications/views/issuer.py` | Notification stream |
| `configs/` | `IntegrationConfigListView` | `views/integration.py` | List configs |
| `configs/<uuid:org_id>/` | `IntegrationConfigDetailView` | `views/integration.py` | GET/PUT config |
| `configs/<uuid:org_id>/sync/` | `IntegrationSyncView` | `views/integration.py` | Trigger sync |
| `configs/<uuid:org_id>/health/` | `IntegrationHealthView` | `views/integration.py` | Health check |
| `sync/` | `LiveSyncTriggerView` | `views/integration.py` | Live sync |
| `sync/logs/` | `SyncLogsView` | `views/integration.py` | Sync logs |
| `analytics/` | `IntegrationAnalyticsView` | `views/analytics.py` | Integration stats |
| `analytics/<uuid:org_id>/` | `OrgIntegrationAnalyticsView` | `views/analytics.py` | Per-org analytics |
| `credentials/` | `IssuerCredentialView` | `views/credentials.py` | GET list, POST issue |
| `credentials/bulk/` | `IssuerCredentialBulkView` | `views/credentials.py` | POST bulk issue |
| `credentials/<str:credential_id>/status/` | `IssuerCredentialStatusView` | `views/credentials.py` | PATCH status |
| `members/` | `IssuerMemberListView` | `views/members.py` | List org members |
| `members/check/` | `IssuerMemberCheckView` | `views/members.py` | Check member via external API |

---

## 4. Backend Module-by-Module Breakdown

### 4.1 Models (`backend/apps/issuer/models/`)

#### 4.1.1 `integration_config.py` — `IntegrationConfig` Model

| File | `backend/apps/issuer/models/integration_config.py` |
|------|-----------------------------------------------------|
| Class | `IntegrationConfig(BaseModel)` |
| DB Table | `issuer_integration_config` |

**Key Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `organization` | OneToOneField → Organization | Links config to organization |
| `auth_type` | CharField(20) | api_key, bearer_token, basic_auth, oauth2, custom_header |
| `api_key` | TextField | API key/token value |
| `api_key_header_name` | CharField(100) | Header name (default: "Authorization") |
| `auth_config` | JSONField | OAuth2 fields etc. |
| `base_url` | URLField | Root URL for external system API |
| `api_version` | CharField(50) | API version |
| `api_protocol` | CharField(20) | rest, graphql, soap |
| `custom_headers` | JSONField | Custom HTTP headers |
| `timeout_seconds` | IntegerField (default=30) | Request timeout |
| `rate_limit_per_minute` | IntegerField (default=60) | Rate limit |
| `sync_enabled` | BooleanField (default=True) | Whether sync is enabled |
| `sync_interval_minutes` | IntegerField (default=60) | Sync interval |
| `last_sync_at` | DateTimeField | Last sync timestamp |
| `next_sync_at` | DateTimeField | Next scheduled sync |
| `sync_status` | CharField(20) | idle, syncing, error, success |
| `consecutive_failures` | IntegerField (default=0) | Failure counter |
| `max_retries` | IntegerField (default=3) | Max retry attempts |
| `retry_backoff_minutes` | IntegerField (default=5) | Exponential backoff base |
| `integration_status` | CharField(20) | active, paused, revoked, pending_setup |
| `connection_health` | CharField(20) | healthy, degraded, unreachable, unknown |
| `last_error_message` | TextField | Last error message |
| `webhook_url` | URLField | Webhook endpoint |
| `webhook_secret` | TextField | Webhook secret |
| `webhook_enabled` | BooleanField (default=False) | Webhook toggle |
| `webhook_events` | JSONField | Event types for webhook |
| `setup_completed_at` | DateTimeField | Setup completion timestamp |
| `setup_step` | IntegerField (default=0) | Setup wizard step |

#### 4.1.2 `field_mapping.py` — `FieldMapping` Model

Maps external system fields to platform credential fields (dot-notation paths).

#### 4.1.3 `__init__.py`

```python
from .integration_config import IntegrationConfig
from .field_mapping import FieldMapping
__all__ = ["IntegrationConfig", "FieldMapping"]
```

---

### 4.2 Views (`backend/apps/issuer/views/`)

#### 4.2.1 `views/__init__.py` — Exports

```python
from .analytics import IntegrationAnalyticsView, OrgIntegrationAnalyticsView
from .credentials import IssuerCredentialBulkView, IssuerCredentialStatusView, IssuerCredentialView
from .integration import (
    IntegrationConfigDetailView, IntegrationConfigListView,
    IntegrationHealthView, IntegrationSyncView,
    LiveSyncTriggerView, SyncLogsView,
)
from .members import IssuerMemberCheckView, IssuerMemberListView
from .organization import IssuerOrgMemberDetailView, IssuerOrgMemberView, IssuerOrganizationView
```

#### 4.2.2 `views/organization.py` — Organization & Team Management

| Class | Endpoint | Methods | Description |
|-------|----------|---------|-------------|
| `IssuerOrganizationView` | `organization/` | GET, PUT, PATCH | Get/update org profile for current issuer |
| `IssuerOrgMemberView` | `organization/members/` | GET, POST | List/add team members |
| `IssuerOrgMemberDetailView` | `organization/members/<uuid:user_id>/` | DELETE, PATCH | Remove/update member role |

**Helper Function:**
```python
def _get_issuer_member(user):
    """Returns the active OrganizationMember for the user, or None."""
    return OrganizationMember.objects.select_related("organization").filter(
        user=user, role__in=["owner", "admin", "staff"], is_active=True
    ).first()
```

**Permission Model:** Only users with role "owner" or "admin" can add/remove members. "staff" members have read access.

#### 4.2.3 `views/integration.py` — Integration & Sync

| Class | Endpoint | Methods | Description |
|-------|----------|---------|-------------|
| `IntegrationConfigListView` | `configs/` | GET | List integration configs (admin: all, issuer: own) |
| `IntegrationConfigDetailView` | `configs/<uuid:org_id>/` | GET, PUT | Get/update config for an org |
| `IntegrationSyncView` | `configs/<uuid:org_id>/sync/` | POST | Trigger member sync for an org |
| `LiveSyncTriggerView` | `sync/` | POST | Trigger live sync (admin: specify org_id) |
| `SyncLogsView` | `sync/logs/` | GET | List recent sync logs |
| `IntegrationHealthView` | `configs/<uuid:org_id>/health/` | POST | Check connection health |

**Helper Function:**
```python
def _get_issuer_org(user):
    """Returns the Organization for the issuer user, or None."""
    membership = OrganizationMember.objects.filter(
        user=user, is_active=True
    ).select_related("organization").first()
    return membership.organization if membership else None
```

**Sync Flow:**
```
POST /api/v1/integration/configs/{org_id}/sync/
    → IntegrationSyncView.post()
        → _get_issuer_org(user)  [permission check]
        → IntegrationService.sync_organization(org)
        → IntegrationManagementService.record_successful_sync(org)
        → Returns { "processed": N, "created": N, "updated": N, "failed": N }
```

#### 4.2.4 `views/credentials.py` — Credential Issuance

| Class | Endpoint | Methods | Description |
|-------|----------|---------|-------------|
| `IssuerCredentialView` | `credentials/` | GET, POST | List org credentials / Issue single credential |
| `IssuerCredentialBulkView` | `credentials/bulk/` | POST | Bulk issue credentials |
| `IssuerCredentialStatusView` | `credentials/<str:credential_id>/status/` | PATCH | Update credential status (revoke, etc.) |

**Issue Single Credential Flow:**
```
POST /api/v1/integration/credentials/
    Body: { "credential_id": "...", "national_id": "...", "credential_type": "...",
            "title": "...", "data": { ... }, "issued_at": "...", "expires_at": "..." }
    
    → IssuerCredentialView.post()
        → _get_issuer_org(user)  [permission check]
        → IssueCredentialSerializer validates input
        → CredentialService.save(organization=org, data=data)
        → Returns 201 with CredentialSerializer data
```

**Bulk Issue Flow:**
```
POST /api/v1/integration/credentials/bulk/
    Body: { "credentials": [ { ... }, { ... } ] }
    
    → IssuerCredentialBulkView.post()
        → _get_issuer_org(user)
        → For each item: CredentialService.save(organization=org, data=item)
        → Returns { "created": N, "failed": N, "errors": [...] }
```

**Status Update Flow:**
```
PATCH /api/v1/integration/credentials/{credential_id}/status/
    Body: { "status": "revoked", "reason": "..." }
    
    → IssuerCredentialStatusView.patch()
        → _get_issuer_org(user)
        → Credential.objects.get(credential_id=credential_id, organization=org)
        → CredentialService.update_status(cred, new_status, reason=reason)
        → Returns updated credential
```

#### 4.2.5 `views/members.py` — External Member Verification

| Class | Endpoint | Methods | Description |
|-------|----------|---------|-------------|
| `IssuerMemberListView` | `members/` | GET | List org members from DB |
| `IssuerMemberCheckView` | `members/check/` | POST | Check member via external org API |

**External Member Check Flow:**
```
POST /api/v1/integration/members/check/
    Body: { "national_id": "...", "identifier": "..." }
    
    → IssuerMemberCheckView.post()
        → _get_issuer_org(user)
        → GET {org.base_api_url}/api/holders/resolve/{national_id}
        → Returns { "is_member": bool, "full_name": "...", "email": "...", 
                     "internal_id": "...", "org_type": "..." }
```

#### 4.2.6 `views/analytics.py` — Analytics

| Class | Endpoint | Methods | Description |
|-------|----------|---------|-------------|
| `IntegrationAnalyticsView` | `analytics/` | GET | Admin: total integrations, healthy, sync stats |
| `OrgIntegrationAnalyticsView` | `analytics/<uuid:org_id>/` | GET | Admin: per-org sync logs |

---

### 4.3 Serializers (`backend/apps/issuer/serializers/`)

#### 4.3.1 `serializers/credential.py` — `IssueCredentialSerializer`

| Field | Type | Required |
|-------|------|----------|
| `credential_id` | CharField | Yes |
| `national_id` | CharField | No (default: "") |
| `credential_type` | CharField | No (default: "") |
| `title` | CharField | No (default: "") |
| `data` | JSONField | No (default: {}) |
| `issued_at` | DateTimeField | No |
| `expires_at` | DateTimeField | No (allow_null) |
| `signature` | CharField | No (allow_blank, allow_null) |
| `signature_algorithm` | CharField | No (allow_blank, allow_null) |
| `raw_payload` | CharField | No (allow_blank, allow_null) |

#### 4.3.2 `serializers/integration_config.py` — 3 Serializers

| Serializer | Purpose |
|------------|---------|
| `FieldMappingSerializer` | Maps external fields → platform fields |
| `IntegrationConfigSerializer` | Full config CRUD (with field_mappings nested) |
| `IntegrationConfigSetupSerializer` | Multi-step setup wizard (step 1-4) |
| `IntegrationStatusSerializer` | Read-only status response |

---

### 4.4 Services (`backend/apps/issuer/services/`)

#### 4.4.1 `services/integration_management_service.py` — `IntegrationManagementService`

| Method | Description |
|--------|-------------|
| `get_or_create_config(organization)` | Get or create IntegrationConfig for org |
| `is_connection_active(organization)` | Check org is approved + trusted + healthy |
| `update_sync_status(organization, status, error)` | Update sync status, increment failures |
| `record_successful_sync(organization)` | Reset failures, set last_sync, schedule next |
| `record_failed_sync(organization, error)` | Increment failures, degrade health |
| `schedule_next_sync(organization, config)` | Set next_sync_at based on interval |

#### 4.4.2 `services/connection_monitor_service.py` — `ConnectionMonitorService`

| Method | Description |
|--------|-------------|
| `check_health(organization)` | Ping external API, validate response, update health status |

---

### 4.5 External Services Used

#### `apps.credentials.services.CredentialService`

| Method | Used By | Description |
|--------|---------|-------------|
| `save(organization, data)` | `IssuerCredentialView.post()`, `IssuerCredentialBulkView.post()` | Creates Credential record |
| `update_status(cred, status, reason)` | `IssuerCredentialStatusView.patch()` | Updates credential status |
| `get_for_holder(user, status, updated_since)` | `HolderCredentialListView.get()` | Lists credentials for holder |

#### `apps.credentials.services.IntegrationService`

| Method | Used By | Description |
|--------|---------|-------------|
| `sync_organization(org)` | `IntegrationSyncView.post()` | Syncs members from external API |

#### `apps.trust_registry.services.TrustService`

| Method | Used By | Description |
|--------|---------|-------------|
| `is_trusted(organization)` | `IntegrationManagementService.is_connection_active()` | Checks if org is trusted |

---

## 5. Frontend Issuer Module

### 5.1 Pages (`frontend/src/pages/issuer/`)

| Page | File | Route | Description |
|------|------|-------|-------------|
| Dashboard | `DashboardPage.jsx` | `/issuer/dashboard` | Stats, recent activity, quick actions |
| Integrations | `IntegrationsPage.jsx` | `/issuer/integrations` | Configure member API, field mappings |
| Sync | `SyncPage.jsx` | `/issuer/sync` | Manual sync trigger, sync logs |
| Analytics | `AnalyticsPage.jsx` | `/issuer/analytics` | Charts, trends, credential stats |
| Notifications | `NotificationsPage.jsx` | `/issuer/notifications` | Notification list & management |
| Settings | `SettingsPage.jsx` | `/issuer/settings` | Org profile, team members, preferences |

### 5.2 API Module (`frontend/src/api/issuer.js`)

| Function | Method | Path | Description |
|----------|--------|------|-------------|
| `getIssuerOrganization()` | GET | `/integration/organization/` | Get org profile |
| `getIntegrationConfigs()` | GET | `/integration/configs/` | List configs |
| `getIntegrationConfig(orgId)` | GET | `/integration/configs/{orgId}/` | Get config |
| `updateIntegrationConfig(orgId, data)` | PUT | `/integration/configs/{orgId}/` | Update config |
| `triggerIntegrationSync(orgId)` | POST | `/integration/configs/{orgId}/sync/` | Trigger sync |
| `checkIntegrationHealth(orgId)` | POST | `/integration/configs/{orgId}/health/` | Health check |
| `triggerLiveSync(data)` | POST | `/integration/sync/` | Live sync |
| `getSyncLogs(params)` | GET | `/integration/sync/logs/` | Sync logs |
| `getIntegrationAnalytics()` | GET | `/integration/analytics/` | Analytics stats |
| `getOrgIntegrationAnalytics(orgId)` | GET | `/integration/analytics/{orgId}/` | Per-org analytics |
| `getIssuerUnreadCount()` | GET | `/integration/notifications/unread-count/` | Unread count |
| `getIssuerNotificationStream(params)` | GET | `/integration/notifications/stream/` | Notif stream |
| `issueCredential(data)` | POST | `/integration/credentials/` | Issue credential |
| `bulkIssueCredentials(data)` | POST | `/integration/credentials/bulk/` | Bulk issue |
| `getIssuerCredentials(params)` | GET | `/integration/credentials/` | List credentials |
| `updateCredentialStatus(credentialId, data)` | PATCH | `/integration/credentials/{id}/status/` | Update status |
| `checkMemberEligibility(data)` | POST | `/integration/members/check/` | Check member |
| `getIssuerMembers()` | GET | `/integration/members/` | List members |
| `getOrganizationTeamMembers()` | GET | `/integration/organization/members/` | Team list |
| `addOrganizationTeamMember(data)` | POST | `/integration/organization/members/` | Add team member |
| `removeOrganizationTeamMember(userId)` | DELETE | `/integration/organization/members/{userId}/` | Remove member |
| `updateOrganizationTeamMemberRole(userId, data)` | PATCH | `/integration/organization/members/{userId}/` | Update role |
| `markNotificationsRead(data)` | POST | `/notifications/mark-read/` | Mark read |

### 5.3 Notifications System

#### 5.3.1 Hook: `useNotifications.js` — Polling (all roles)

```
┌─────────────────────────────────────────────┐
│  useNotifications()                          │
│                                             │
│  On mount:                                   │
│    fetchCount() → GET /notifications/        │
│                    unread-count/             │
│                                             │
│  Polling: setInterval(fetchCount, 5000ms)   │
│                                             │
│  fetchNotifications(params):                 │
│    GET /notifications/?params               │
│    → storeModule.setState({ notifications }) │
└─────────────────────────────────────────────┘
```

#### 5.3.2 Hook: `useSSENotifications.js` — Real-time (issuer only)

```
┌─────────────────────────────────────────────┐
│  useSSENotifications()                       │
│                                             │
│  Opens EventSource to:                       │
│    /integration/notifications/stream/        │
│    ?token=JWT                               │
│                                             │
│  On "connected" event: reset unread count   │
│  On "notification" event:                   │
│    increment unread count, show toast       │
│                                             │
│  Auto-reconnect with exponential backoff    │
│  (5s → max 60s)                             │
└─────────────────────────────────────────────┘
```

---

## 6. Complete Credential Issuance Data Flow

### 6.1 Single Credential Issue

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  Issuer      │     │  Django Backend  │     │  Credential Service  │     │  Frontend UI   │
│  (Browser)   │     │                  │     │                      │     │                │
├──────────────┤     ├──────────────────┤     ├──────────────────────┤     ├────────────────┤
│              │     │                  │     │                      │     │                │
│  Issue Form  │────→│ POST /api/v1/    │────→│ CredentialService    │     │                │
│  (Click      │     │ integration/     │     │ .save(org, data)     │     │                │
│  "Issue")    │     │ credentials/     │     │                      │     │                │
│              │     │                  │     │ Creates Credential   │     │                │
│              │     │ IssuerCredential │     │ record in DB         │     │                │
│              │     │ View.post()      │     │                      │     │                │
│              │     │                  │     │ Sends notification   │     │                │
│              │     │ 1. _get_issuer_  │     │ to holder            │     │                │
│              │     │    org(user)     │     │                      │     │                │
│              │     │ 2. Validate with │     │                      │     │                │
│              │     │    IssueCred     │     │                      │     │                │
│              │     │    Serializer    │     │                      │     │                │
│              │     │ 3. Credential    │     │                      │     │                │
│              │     │    Service.save  │     │                      │     │                │
│              │     │                  │     │                      │     │                │
│              │←────│ 201 Created      │←────│                      │     │                │
│              │     │ + Credential JSON│     │                      │     │                │
│              │     │                  │     │                      │     │ Success Toast  │
│              │     │                  │     │                      │     │ + Redirect     │
└──────────────┘     └──────────────────┘     └──────────────────────┘     └────────────────┘
```

### 6.2 Sync-Then-Issue Flow (Integration Pattern)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Frontend    │     │  Django API  │     │ External Org │     │  Credential  │
│              │     │              │     │ API (Member) │     │  Service     │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│              │     │              │     │              │     │              │
│  1. Sync     │────→│ POST /configs│────→│ GET /api/    │     │              │
│     Members  │     │ /{org}/sync/ │     │ holders/     │     │              │
│              │     │              │←────│ resolve/{nid}│     │              │
│              │     │              │     │              │     │              │
│  2. Check    │────→│ POST /members│────→│ (same)       │     │              │
│     Member   │     │ /check/      │     │              │     │              │
│              │     │              │←────│ is_member?   │     │              │
│              │     │              │     │              │     │              │
│  3. Issue    │────→│ POST /creden │────→│              │────→│ .save()      │
│     Cred     │     │ tials/       │     │              │     │              │
│              │     │              │     │              │     │              │
│  4. Check    │────→│ PATCH /creden│────→│              │────→│ .update_     │
│     Status   │     │ tials/{id}/  │     │              │     │ status()     │
│              │     │ status/      │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 7. File-by-File Index (Issuer Only)

### 7.1 Backend Files

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/apps/issuer/urls.py` | All issuer URL routes (17 endpoints) |
| 2 | `backend/apps/issuer/views/__init__.py` | View exports |
| 3 | `backend/apps/issuer/views/organization.py` | Org profile + team member CRUD |
| 4 | `backend/apps/issuer/views/integration.py` | Integration config + sync + health |
| 5 | `backend/apps/issuer/views/credentials.py` | Single + bulk credential issue, status update |
| 6 | `backend/apps/issuer/views/members.py` | External member check API |
| 7 | `backend/apps/issuer/views/analytics.py` | Integration analytics + sync stats |
| 8 | `backend/apps/issuer/models/__init__.py` | Model exports |
| 9 | `backend/apps/issuer/models/integration_config.py` | IntegrationConfig model |
| 10 | `backend/apps/issuer/models/field_mapping.py` | FieldMapping model |
| 11 | `backend/apps/issuer/serializers/__init__.py` | Serializer exports |
| 12 | `backend/apps/issuer/serializers/credential.py` | IssueCredentialSerializer |
| 13 | `backend/apps/issuer/serializers/integration_config.py` | 4 serializers for config |
| 14 | `backend/apps/issuer/services/__init__.py` | Service exports |
| 15 | `backend/apps/issuer/services/integration_management_service.py` | Config management + sync tracking |
| 16 | `backend/apps/issuer/services/connection_monitor_service.py` | Health check service |
| 17 | `backend/apps/notifications/views/issuer.py` | IssuerUnreadCountView, IssuerNotificationStreamView |
| 18 | `backend/apps/credentials/services/credential_service.py` | CredentialService.save(), update_status() |
| 19 | `backend/apps/credentials/services/integration_service.py` | IntegrationService.sync_organization() |
| 20 | `backend/apps/credentials/services/live_sync_service.py` | LiveSyncService.sync() |

### 7.2 Frontend Files

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `frontend/src/api/issuer.js` | All issuer API functions (35+ functions) |
| 2 | `frontend/src/api/axios.js` | Axios instance + JWT interceptor |
| 3 | `frontend/src/utils/constants.js` | API_BASE_URL = VITE_API_URL |
| 4 | `frontend/src/api/notifications.js` | Generic notification API |
| 5 | `frontend/src/hooks/useNotifications.js` | Polling hook for all roles |
| 6 | `frontend/src/hooks/useSSENotifications.js` | SSE hook for issuer real-time |
| 7 | `frontend/src/pages/issuer/DashboardPage.jsx` | Issuer dashboard |
| 8 | `frontend/src/pages/issuer/IntegrationsPage.jsx` | Integration config UI |
| 9 | `frontend/src/pages/issuer/SyncPage.jsx` | Sync management UI |
| 10 | `frontend/src/pages/issuer/AnalyticsPage.jsx` | Analytics UI |
| 11 | `frontend/src/pages/issuer/NotificationsPage.jsx` | Notification list UI |
| 12 | `frontend/src/pages/issuer/SettingsPage.jsx` | Org settings UI |
| 13 | `frontend/src/components/common/NotificationBell.jsx` | Notification bell component |

---

## 8. API Response Format (All Issuer Endpoints)

All responses use `success_response()` from `common/api_response.py`:

```json
{
    "success": true,
    "data": { ... },       // The actual payload (array or object)
    "message": "..."       // Optional, for status messages
}
```

Error responses use `error_response()`:

```json
{
    "success": false,
    "errors": "..."        // Error message or object
}
```

---

## 9. Common Issues & Fixes (Issuer Only)

| Issue | Root Cause | Fix |
|-------|------------|-----|
| 404 on `/api/auth/login/` | `.env` missing `/v1` prefix | Set `VITE_API_URL=http://localhost:8000/api/v1` |
| 404 on `/notifications/unread-count/` | No generic endpoint existed | Added `UnreadCountView` + route |
| 404 on `/${role}/notifications/...` | Frontend used role-templated paths | Changed to generic `/notifications/...` |
| Sync fails with 502 | External org API unreachable | Check org's `base_api_url` config |
| "Organization not found" | User not linked to org as member | Add user via admin panel |
| "Permission denied" | User role is not owner/admin/staff | Update role in OrganizationMember |
| Axios unwrap issue | `response.data` was wrapper object | Added auto-unwrap in axios interceptor |

---

## 10. Permission Model Summary

| View | Allowed Roles |
|------|---------------|
| `IssuerOrganizationView` | owner, admin, staff |
| `IssuerOrgMemberView` | GET: all; POST: owner, admin |
| `IssuerOrgMemberDetailView` | DELETE/PATCH: owner, admin |
| `IntegrationConfigListView` | admin (all), issuer (own) |
| `IntegrationConfigDetailView` | admin, issuer (own) |
| `IntegrationSyncView` | admin, issuer (own) |
| `IntegrationHealthView` | admin, issuer (own) |
| `LiveSyncTriggerView` | admin, issuer (own) |
| `SyncLogsView` | admin (all), issuer (own) |
| `IssuerCredentialView` | admin, issuer (own org) |
| `IssuerCredentialBulkView` | admin, issuer (own org) |
| `IssuerCredentialStatusView` | admin, issuer (own org) |
| `IssuerMemberListView` | admin, issuer (own org) |
| `IssuerMemberCheckView` | admin, issuer (own org) |
| `IntegrationAnalyticsView` | admin only |
| `OrgIntegrationAnalyticsView` | admin only |