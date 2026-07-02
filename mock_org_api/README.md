# Federated Organization Integration Platform — Mock API Server

Simulates the **Federated Organization Integration Platform** architecture where multiple independent organizations operate their own systems while participating in a shared ecosystem through standardized APIs.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                  FEDERATED ORGANIZATION INTEGRATION PLATFORM          │
│                                                                      │
│  Service Discovery  │  Unified Search  │  Event Bus  │  Dashboard   │
│  /api/v1/registry/  │  /api/v1/search  │  /api/v1/events           │
└────────┬──────┬──────┬──────┬──────┬──────┬─────────────────────────┘
         │      │      │      │      │      │
         ▼      ▼      ▼      ▼      ▼      ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Univ.   │ │Gov.    │ │Employer│ │Hospital│ │Financial│
    │System  │ │System  │ │System  │ │System  │ │System   │
    │/orgs/  │ │/orgs/  │ │/orgs/  │ │/orgs/  │ │/orgs/   │
    │univ.   │ │gov.    │ │employer│ │hospital│ │financial│
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
         │          │          │          │          │
    Each org has its OWN database, API key, business logic.
    Data never crosses org boundaries except through the platform.
```

## Core Principles

- **Each organization is an independent system** — own data, own API key, own authentication
- **Standardized API contract** — all orgs expose the same `/api/v1/` endpoints
- **Data stays at the source** — platform retrieves through APIs, never duplicates
- **Real-time access** — events are published when credentials are issued/revoked
- **Unified view** — platform aggregates and normalizes responses into a common schema
- **Pluggable** — orgs can join/leave without affecting others

## Quick Start

```bash
cd mock_org_api
npm install
npm start
# Server at http://localhost:3001
```

## Organizations

| Type       | Name                         | Entities | API Key           | Base URL                        |
|-----------|------------------------------|----------|-------------------|---------------------------------|
| University | Tech Valley University        | 6        | `key-uni-mock-001` | `/orgs/university/api/v1`       |
| Government | Ethiopian Civil Service Agency| 5        | `key-gov-mock-001` | `/orgs/government/api/v1`       |
| Employer   | Pan-African Tech Corp         | 5        | `key-emp-mock-001` | `/orgs/employer/api/v1`         |
| Hospital   | MedCity General Hospital      | 7        | `key-hos-mock-001` | `/orgs/hospital/api/v1`         |
| Financial  | Union Bank of Africa          | 7        | `key-fin-mock-001` | `/orgs/financial/api/v1`        |

**Platform API Key:** `platform-admin-key`

## Unified Platform Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/health` | Public | Platform health + per-org stats |
| `GET` | `/api/v1/registry/organizations` | Public | Service discovery — all orgs + their endpoints |
| `GET` | `/api/v1/registry/organizations/:type` | Public | Single org registry entry |
| `GET` | `/api/v1/search?q=&org_type=&status=` | Platform Key | Cross-org entity search |
| `GET` | `/api/v1/unified/entities` | Platform Key | Aggregated entity list (unified schema) |
| `GET` | `/api/v1/events` | Platform Key | Global event stream (all orgs) |
| `POST` | `/api/v1/webhooks/ingest` | Platform Key | Ingest external webhook events |
| `GET` | `/api/v1/dashboard` | Platform Key | Platform statistics dashboard |

## Per-Organization Standardized API Contract

Each organization exposes these endpoints under its namespace:

### `GET /orgs/{type}/api/v1/health`
Returns org system health, entity count, credential count, event count.

### `GET /orgs/{type}/api/v1/organizations/profile`
Returns org profile with supported features, endpoints, entity types.

### `GET /orgs/{type}/api/v1/entities/search?q=&status=&department=`
Search entities with standardized response. Returns unified data model.

### `GET /orgs/{type}/api/v1/entities/:id`
Get entity detail by national_id, email, or org-specific ID.

### `GET /orgs/{type}/api/v1/entities?status=`
List all entities with pagination.

### `GET /orgs/{type}/api/v1/credentials?entity_id=&status=&type=`
List credentials, optionally filtered by entity.

### `POST /orgs/{type}/api/v1/credentials/issue`
Issue a new credential. Generates a `credential.issued` event.

```json
{
  "credential_id": "cred-custom-001",
  "national_id": "NID-1234567890",
  "credential_type": "MembershipCredential",
  "title": "Gold Member Certificate",
  "data": { "tier": "gold" },
  "issued_at": "2025-01-01T00:00:00Z"
}
```

### `POST /orgs/{type}/api/v1/credentials/:id/revoke`
Revoke a credential. Generates a `credential.revoked` event.

### `POST /orgs/{type}/api/v1/webhooks/events`
Send webhook events to this org system.

### `GET /orgs/{type}/api/v1/events?since=`
Poll events published by this org (for platform to consume).

## Unified Data Model

All entities are normalized into this schema:

```json
{
  "organizationId": "org-uni-001",
  "organizationName": "Tech Valley University",
  "organizationType": "university",
  "entityId": "STU-2024-001",
  "entityType": "student",
  "entityName": "Amara Osei",
  "nationalId": "NID-1234567890",
  "email": "amara.osei@testuniversity.edu",
  "phone": "+233200000001",
  "department": "Science & Engineering",
  "status": "active",
  "lastUpdated": "2025-06-24T..."
}
```

Type-specific fields are appended based on organization type (e.g., `programme`, `gpa` for university; `specialization`, `licenseExpiry` for hospital).

## Event-Driven Architecture

When credentials are issued or revoked, events are:

1. Published to the org's internal event log (`GET /api/v1/events`)
2. Available for the platform to poll and aggregate
3. Recorded in the global event stream (`GET /api/v1/events`)

Events can also be ingested from external systems via `POST /api/v1/webhooks/ingest`.

```json
{
  "id": "evt-uni-1719000000-abc123",
  "org_id": "org-uni-001",
  "org_name": "Tech Valley University",
  "org_type": "university",
  "event_type": "credential.issued",
  "payload": {
    "credential_id": "cred-custom-001",
    "national_id": "NID-1234567890",
    "title": "Gold Member Certificate"
  },
  "timestamp": "2025-06-24T12:00:00Z"
}
```

## Authentication

| Scope | Header | Value |
|-------|--------|-------|
| Platform | `X-API-Key` | `platform-admin-key` |
| Organisation | `X-API-Key` | Per-org key (see table above) |

Also accepted as `Authorization: Bearer <key>`.

## CredWallet Integration Configuration

### Issuer Portal → API Configuration

| Field | Value |
|-------|-------|
| API Base URL | `http://localhost:3001` |
| API Key Header | `X-API-Key` |
| Platform API Key | `platform-admin-key` |
| Health Endpoint | `/api/v1/health` |
| Registry | `/api/v1/registry/organizations` |

### Issuer → Credential Flow

```
1. Discover orgs        → GET /api/v1/registry/organizations
2. Check org health     → GET /orgs/{type}/api/v1/health
3. Search entity        → GET /orgs/{type}/api/v1/entities/search?q=NID-1234567890
4. Issue credential     → POST /orgs/{type}/api/v1/credentials/issue
5. Verify credential    → GET /orgs/{type}/api/v1/credentials/{id}/status
6. Revoke credential    → POST /orgs/{type}/api/v1/credentials/{id}/revoke
7. Unified view         → GET /api/v1/unified/entities
```

### Platform → Backend Sync (Phase 7-9 Flow)

```
ConnectionMonitor checks  → GET /orgs/{type}/api/v1/health
Holder resolution         → GET /orgs/{type}/api/holders/resolve/:national_id
Credential sync           → GET /orgs/{type}/api/v1/credentials
```

## Test Identifiers

Cross-reference — these national_ids exist across multiple orgs:

| National ID | University | Government | Employer | Hospital | Financial |
|-------------|-----------|-----------|----------|----------|-----------|
| `NID-1234567890` | ✅ active | ✅ active | ✅ active | ✅ active | ✅ active |
| `NID-0987654321` | ✅ active | ✅ active | ✅ active | ✅ active | ✅ active |
| `NID-1111111111` | ✅ active | ✅ active | ✅ active | ✅ active | ✅ active |
| `NID-2222222222` | ✅ active | — | ✅ active | — | — |
| `NID-3333333333` | ✅ active | — | — | — | ✅ active |
| `NID-4444444444` | ❌ inactive | — | — | — | — |
| `NID-5555555555` | — | ✅ active | — | ✅ active | — |
| `NID-6666666666` | — | ❌ suspended | — | — | — |
| `NID-7777777777` | — | — | ✅ active | ✅ active | ✅ active |
| `NID-8888888888` | — | — | ❌ terminated | — | — |
| `NID-9999999999` | ✅ active | — | — | — | ✅ active |
| `NID-0000000010` | — | — | — | ✅ active | ❌ suspended |
| `NID-0000000020` | — | — | — | ✅ active | — |
