/**
 * Federated Organization Integration Platform — Mock API Server
 * ==============================================================
 *
 * Architecture:
 *   Each organization operates as an INDEPENDENT SYSTEM with its own
 *   database, API key, and standardized /api/v1/ API gateway.
 *   The Unified Platform Layer provides service discovery, unified search,
 *   event aggregation, and a single dashboard view.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Unified Platform Layer                        │
 * │  GET /api/v1/registry/organizations   (service discovery)       │
 * │  GET /api/v1/search                   (unified cross-org query) │
 * │  GET /api/v1/unified/entities         (aggregated entity view)  │
 * │  GET /api/v1/events                   (global event stream)     │
 * │  POST /api/v1/webhooks/ingest         (event ingestion)         │
 * │  GET /api/v1/health                   (platform health)         │
 * └──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
 *        │      │      │      │      │      │
 *        ▼      ▼      ▼      ▼      ▼      ▼
 *   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
 *   │Univ.   │ │Gov.    │ │Employer│ │Hospital│ │Financial│
 *   │System  │ │System  │ │System  │ │System  │ │System   │
 *   │/orgs/  │ │/orgs/  │ │/orgs/  │ │/orgs/  │ │/orgs/   │
 *   │univ.   │ │gov.    │ │employer│ │hospital│ │financial│
 *   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
 *        │          │          │          │          │
 *   Each org has its own database, API key, and business logic.
 *   Data never crosses org boundaries except through the platform.
 *
 * Standardized API Contract (per org, under /orgs/{type}/api/v1/):
 *   GET    /health                    — Health check
 *   GET    /organizations/profile     — Organization profile
 *   GET    /entities/search           — Search entities with unified schema
 *   GET    /entities/:id              — Entity detail
 *   GET    /credentials               — List credentials
 *   POST   /credentials/issue         — Issue credential (generates event)
 *   POST   /credentials/:id/revoke    — Revoke credential (generates event)
 *   POST   /webhooks/events           — Accept/receive webhook events
 *   GET    /events                    — Event log for platform polling
 *
 * Legacy /api/* endpoints maintained for backward compatibility
 * with the CredWallet sync pipeline (Phase 7-9).
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createOrganizationSystem } = require('./lib/org-system');

const app = express();
const PORT = process.env.PORT || 3001;
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || 'platform-admin-key';

app.use(express.json());

// ─── Data Loader ───────────────────────────────────────────────────────────

function loadData(filename) {
  const legacyPath = path.join(__dirname, filename);
  const dataPath = path.join(__dirname, 'data', filename);
  const filePath = fs.existsSync(dataPath) ? dataPath : legacyPath;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ─── Request Logger ────────────────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalPath || req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
//  ORGANIZATION REGISTRY — Each org is an independent system
// ═══════════════════════════════════════════════════════════════════════════

const ORG_CONFIGS = {
  university: {
    id: 'org-uni-001',
    name: 'Tech Valley University',
    type: 'university',
    data: loadData('university_members.json'),
    apiKey: 'key-uni-mock-001',
  },
  government: {
    id: 'org-gov-001',
    name: 'Ethiopian Civil Service Agency',
    type: 'government',
    data: loadData('government_records.json'),
    apiKey: 'key-gov-mock-001',
  },
  employer: {
    id: 'org-emp-001',
    name: 'Pan-African Tech Corp',
    type: 'employer',
    data: loadData('employer_records.json'),
    apiKey: 'key-emp-mock-001',
  },
  hospital: {
    id: 'org-hos-001',
    name: 'MedCity General Hospital',
    type: 'hospital',
    data: loadData('hospital_patients.json'),
    apiKey: 'key-hos-mock-001',
  },
  financial: {
    id: 'org-fin-001',
    name: 'Union Bank of Africa',
    type: 'financial',
    data: loadData('financial_customers.json'),
    apiKey: 'key-fin-mock-001',
  },
};

// ─── Instantiate each organization system ─────────────────────────────────

const orgSystems = {};
for (const [type, config] of Object.entries(ORG_CONFIGS)) {
  orgSystems[type] = createOrganizationSystem(config);
}

// ─── Mount each org under its own namespace ───────────────────────────────

for (const [type, system] of Object.entries(orgSystems)) {
  app.use(`/orgs/${type}`, system.router);
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNIFIED PLATFORM LAYER
// ═══════════════════════════════════════════════════════════════════════════

// ─── Platform Auth Middleware ──────────────────────────────────────────────

function platformAuth(req, res, next) {
  const key =
    req.headers['x-api-key'] ||
    (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!key || key !== PLATFORM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', detail: 'Valid platform API key required' });
  }
  next();
}

// ─── Global event bus (in-memory) ─────────────────────────────────────────

const globalEventBus = [];

function publishGlobalEvent(eventType, payload, sourceOrg) {
  const event = {
    id: `evt-global-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    event_type: eventType,
    source: sourceOrg,
    payload,
    timestamp: new Date().toISOString(),
  };
  globalEventBus.unshift(event);
  if (globalEventBus.length > 500) globalEventBus.length = 500;
  return event;
}

// ─── Platform Health ──────────────────────────────────────────────────────

app.get('/api/v1/health', (req, res) => {
  const orgStatus = {};
  for (const [type, system] of Object.entries(orgSystems)) {
    orgStatus[type] = {
      id: system.orgId,
      name: system.orgName,
      entityCount: system.getEntities().length,
      credentialCount: system.getCredentials().length,
      eventCount: system.getEvents().length,
      healthy: true,
    };
  }

  res.json({
    status: 'ok',
    service: 'Federated Organization Integration Platform',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    organizationCount: Object.keys(orgSystems).length,
    organizations: orgStatus,
    platform: {
      totalEntities: Object.values(orgSystems).reduce((s, o) => s + o.getEntities().length, 0),
      totalCredentials: Object.values(orgSystems).reduce((s, o) => s + o.getCredentials().length, 0),
      globalEvents: globalEventBus.length,
      orgEvents: Object.values(orgSystems).reduce((s, o) => s + o.getEvents().length, 0),
    },
  });
});

// ─── Service Registry / Discovery ─────────────────────────────────────────

app.get('/api/v1/registry/organizations', (req, res) => {
  const registry = {};
  for (const [type, system] of Object.entries(orgSystems)) {
    registry[type] = {
      id: system.orgId,
      name: system.orgName,
      type: system.orgType,
      status: 'active',
      entityCount: system.getEntities().length,
      credentialCount: system.getCredentials().length,
      apiBaseUrl: `/orgs/${type}/api/v1`,
      endpoints: {
        health: `/orgs/${type}/api/v1/health`,
        profile: `/orgs/${type}/api/v1/organizations/profile`,
        entitySearch: `/orgs/${type}/api/v1/entities/search`,
        entityDetail: `/orgs/${type}/api/v1/entities/:id`,
        credentials: `/orgs/${type}/api/v1/credentials`,
        issueCredential: `/orgs/${type}/api/v1/credentials/issue`,
        revokeCredential: `/orgs/${type}/api/v1/credentials/:id/revoke`,
        webhookEvents: `/orgs/${type}/api/v1/webhooks/events`,
        events: `/orgs/${type}/api/v1/events`,
      },
    };
  }
  res.json({
    platform: {
      name: 'Federated Organization Integration Platform',
      version: '4.0.0',
      apiBaseUrl: '/api/v1',
    },
    organizations: registry,
    totalOrgs: Object.keys(registry).length,
  });
});

app.get('/api/v1/registry/organizations/:type', (req, res) => {
  const system = orgSystems[req.params.type];
  if (!system) {
    return res.status(404).json({ error: 'Organization type not found' });
  }
  res.json({
    id: system.orgId,
    name: system.orgName,
    type: system.orgType,
    status: 'active',
    entityCount: system.getEntities().length,
    credentialCount: system.getCredentials().length,
    apiBaseUrl: `/orgs/${system.orgType}/api/v1`,
    apiKey: system.apiKey,
  });
});

// ─── Unified Search (cross-org) ───────────────────────────────────────────

app.get('/api/v1/search', platformAuth, (req, res) => {
  const { q, org_type, entity_type, status, limit } = req.query;
  let typesToSearch = org_type ? [org_type] : Object.keys(orgSystems);
  if (org_type && !orgSystems[org_type]) {
    return res.status(400).json({ error: `Unknown org_type: ${org_type}. Valid: ${Object.keys(orgSystems).join(', ')}` });
  }

  const results = [];
  const pageSize = Math.min(parseInt(limit) || 20, 100);

  for (const type of typesToSearch) {
    const system = orgSystems[type];
    let entities = system.getEntities();

    if (q) {
      const query = q.toLowerCase();
      entities = entities.filter(e =>
        e.full_name?.toLowerCase().includes(query) ||
        e.national_id?.toLowerCase().includes(query) ||
        e.email?.toLowerCase().includes(query)
      );
    }
    if (status) {
      entities = entities.filter(e => e.status === status);
    }

    for (const entity of entities) {
      // Import the toUnifiedEntity via the org system's last credential response
      // or reconstruct inline
      const idField = system.idField || 'id';
      results.push({
        organizationId: system.orgId,
        organizationName: system.orgName,
        organizationType: system.orgType,
        entityId: entity[idField] || entity.national_id,
        entityType: type,
        entityName: entity.full_name,
        nationalId: entity.national_id,
        email: entity.email,
        department: entity.department || null,
        status: entity.status,
        lastUpdated: new Date().toISOString(),
        _links: {
          self: `/orgs/${type}/api/v1/entities/${entity[idField] || entity.national_id}`,
          credentials: `/orgs/${type}/api/v1/credentials?entity_id=${entity[idField] || entity.national_id}`,
        },
      });
    }
  }

  // Sort by name
  results.sort((a, b) => a.entityName.localeCompare(b.entityName));

  const total = results.length;
  const page = parseInt(req.query.page) || 1;
  const paginated = results.slice((page - 1) * pageSize, page * pageSize);

  res.json({
    results: paginated,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    query: {
      q: q || null,
      org_type: org_type || 'all',
      status: status || 'all',
    },
  });
});

// ─── Unified Entity View ──────────────────────────────────────────────────

app.get('/api/v1/unified/entities', platformAuth, (req, res) => {
  const { org_type, status, limit } = req.query;
  let typesToSearch = org_type ? [org_type] : Object.keys(orgSystems);

  const results = [];
  for (const type of typesToSearch) {
    const system = orgSystems[type];
    if (!system) continue;

    let entities = system.getEntities();
    if (status) {
      entities = entities.filter(e => e.status === status);
    }

    const idField = system.idField || 'id';
    for (const entity of entities) {
      results.push({
        organizationId: system.orgId,
        organizationName: system.orgName,
        organizationType: system.orgType,
        entityId: entity[idField] || entity.national_id,
        entityType: type,
        entityName: entity.full_name,
        nationalId: entity.national_id,
        email: entity.email,
        department: entity.department || null,
        status: entity.status,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  const pageSize = Math.min(parseInt(limit) || 50, 200);
  const page = parseInt(req.query.page) || 1;
  const total = results.length;

  res.json({
    results: results.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    filters: { org_type: org_type || 'all', status: status || 'all' },
  });
});

// ─── Global Event Stream ──────────────────────────────────────────────────

app.get('/api/v1/events', platformAuth, (req, res) => {
  const { since, org_type, limit } = req.query;
  let events = [...globalEventBus];

  // Also aggregate per-org events
  const orgTypes = org_type ? [org_type] : Object.keys(orgSystems);
  for (const type of orgTypes) {
    const system = orgSystems[type];
    if (!system) continue;
    const orgEvents = system.getEvents();
    if (since) {
      events = events.concat(orgEvents.filter(e => e.timestamp >= since));
    } else {
      events = events.concat(orgEvents);
    }
  }

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const pageSize = Math.min(parseInt(limit) || 50, 200);
  const page = parseInt(req.query.page) || 1;
  const total = events.length;

  res.json({
    events: events.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

// ─── Webhook Ingestion — platform receives events from orgs ───────────────

app.post('/api/v1/webhooks/ingest', platformAuth, (req, res) => {
  const { event_type, payload, source } = req.body;
  if (!event_type) {
    return res.status(400).json({ error: 'event_type is required' });
  }
  const event = publishGlobalEvent(event_type, payload || {}, source || 'external');
  res.status(202).json({ success: true, message: 'Event ingested', event });
});

// ─── Platform Dashboard Stats ──────────────────────────────────────────────

app.get('/api/v1/dashboard', platformAuth, (req, res) => {
  const orgStats = {};
  let totalActive = 0;
  let totalInactive = 0;

  for (const [type, system] of Object.entries(orgSystems)) {
    const entities = system.getEntities();
    const active = entities.filter(e => e.status === 'active').length;
    const inactive = entities.length - active;
    totalActive += active;
    totalInactive += inactive;

    orgStats[type] = {
      name: system.orgName,
      totalEntities: entities.length,
      active,
      inactive,
      totalCredentials: system.getCredentials().length,
      eventsLogged: system.getEvents().length,
    };
  }

  res.json({
    platform: {
      name: 'Federated Organization Integration Platform',
      version: '4.0.0',
      uptime: process.uptime(),
    },
    summary: {
      totalOrganizations: Object.keys(orgSystems).length,
      totalEntities: totalActive + totalInactive,
      totalActive,
      totalInactive,
      totalCredentials: Object.values(orgSystems).reduce((s, o) => s + o.getCredentials().length, 0),
      totalEvents: Object.values(orgSystems).reduce((s, o) => s + o.getEvents().length, 0) + globalEventBus.length,
    },
    organizations: orgStats,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  LEGACY ENDPOINTS (backward compat with CredWallet Phase 7-9)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Global Credential Collection ─────────────────────────────────────────

function getAllCredentials() {
  const all = [];
  for (const system of Object.values(orgSystems)) {
    all.push(...system.getCredentials());
  }
  return all;
}

app.get('/api/health', (req, res) => {
  const all = getAllCredentials();
  res.json({
    status: 'ok',
    service: 'Mock Multi-Org API (Legacy)',
    version: '4.0.0',
    organizations: Object.keys(orgSystems).reduce((acc, type) => {
      acc[type] = {
        members: orgSystems[type].getEntities().length,
        credentials: orgSystems[type].getCredentials().length,
      };
      return acc;
    }, {}),
  });
});

app.get('/api/credentials/', (req, res) => {
  let results = getAllCredentials();
  if (req.query.since) results = results.filter(c => c.issued_at >= req.query.since);
  if (req.query.status) results = results.filter(c => c.status === req.query.status);
  res.json({ results, total: results.length });
});

app.get('/api/credentials/:credential_id', (req, res) => {
  const all = getAllCredentials();
  const cred = all.find(c => c.credential_id === req.params.credential_id);
  if (!cred) return res.status(404).json({ error: 'Credential not found' });
  res.json(cred);
});

app.get('/api/credentials/:credential_id/status', (req, res) => {
  const all = getAllCredentials();
  const cred = all.find(c => c.credential_id === req.params.credential_id);
  if (!cred) return res.status(404).json({ error: 'Credential not found' });
  const expired = cred.expires_at ? new Date(cred.expires_at) < new Date() : false;
  res.json({
    credential_id: cred.credential_id,
    status: expired ? 'expired' : cred.status,
    is_revoked: cred.status === 'revoked',
    is_expired: expired,
    issued_at: cred.issued_at,
    expires_at: cred.expires_at || null,
    last_checked: new Date().toISOString(),
  });
});

app.get('/api/credentials/revoked/', (req, res) => {
  const all = getAllCredentials();
  const revoked = all.filter(c => c.status === 'revoked');
  res.json({
    revoked: revoked.map(c => c.credential_id),
    details: revoked.map(c => ({
      credential_id: c.credential_id,
      revoked_at: c.revoked_at || null,
      reason: c.revocation_reason || 'No reason provided',
    })),
  });
});

// ─── Members (all orgs) ────────────────────────────────────────────────────

app.get('/api/members/', (req, res) => {
  const results = [];
  for (const [type, system] of Object.entries(orgSystems)) {
    for (const e of system.getEntities()) {
      results.push({ ...e, org_type: type, org_name: system.orgName });
    }
  }
  let filtered = results;
  if (req.query.org_type) filtered = filtered.filter(m => m.org_type === req.query.org_type);
  if (req.query.status) filtered = filtered.filter(m => m.status === req.query.status);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    filtered = filtered.filter(m =>
      m.full_name?.toLowerCase().includes(q) ||
      m.national_id?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  }
  res.json({ results: filtered, total: filtered.length });
});

// ─── Member verify ─────────────────────────────────────────────────────────

app.post('/api/members/verify', (req, res) => {
  const identifier = req.body?.member_id || req.body?.national_id || req.body?.identifier;
  if (!identifier) {
    return res.status(400).json({ is_eligible: false, reason: 'member_id, national_id, or identifier is required' });
  }
  for (const [type, system] of Object.entries(orgSystems)) {
    const entity = system.getEntities().find(e =>
      e.national_id === identifier ||
      e[system.idField] === identifier ||
      e.email === identifier
    );
    if (entity) {
      return res.json({
        is_eligible: entity.status === 'active',
        member: {
          full_name: entity.full_name,
          national_id: entity.national_id,
          email: entity.email,
          phone: entity.phone || null,
          org_type: type,
          org_name: system.orgName,
          department: entity.department || null,
          status: entity.status,
        },
      });
    }
  }
  res.json({ is_eligible: false, reason: `No member found: ${identifier}` });
});

app.post('/api/members/verify-extended', (req, res) => {
  const identifier = req.body?.member_id || req.body?.national_id;
  if (!identifier) return res.json({ is_eligible: false, reason: 'Identifier required' });
  for (const [type, system] of Object.entries(orgSystems)) {
    const entity = system.getEntities().find(e =>
      e.national_id === identifier ||
      e[system.idField] === identifier ||
      e.email === identifier
    );
    if (entity && entity.status === 'active') {
      return res.json({
        is_eligible: true,
        data: {
          personal: { full_name: entity.full_name, national_id: entity.national_id, email: entity.email, phone: entity.phone },
          organization: { type, name: system.orgName, department: entity.department },
          membership: { number: entity[system.idField] || entity.national_id, status: entity.status },
        },
      });
    }
  }
  res.json({ is_eligible: false, reason: 'Member not found or inactive' });
});

// Org-specific legacy verify
for (const [type, system] of Object.entries(orgSystems)) {
  const idField = system.idField;

  app.get(`/${type}/members`, (req, res) => {
    res.json({ count: system.getEntities().length, org: system.orgName, org_type: type, results: system.getEntities() });
  });

  app.get(`/${type}/members/:member_id`, (req, res) => {
    const entity = system.getEntities().find(e => e[idField] === req.params.member_id || e.national_id === req.params.member_id);
    if (!entity) return res.status(404).json({ error: 'Member not found' });
    res.json(entity);
  });

  app.post(`/${type}/members/verify`, (req, res) => {
    const identifier = req.body?.member_id || req.body?.national_id || req.body?.identifier;
    if (!identifier) return res.status(400).json({ is_eligible: false, reason: 'member_id is required' });
    const entity = system.getEntities().find(e =>
      e.national_id === identifier || e[idField] === identifier || e.email === identifier
    );
    if (!entity) return res.json({ is_eligible: false, reason: `No member found in ${system.orgName}: ${identifier}` });
    if (entity.status !== 'active') return res.json({ is_eligible: false, reason: `Member status is ${entity.status}` });
    res.json({
      is_eligible: true,
      org_type: type,
      org_name: system.orgName,
      member: {
        full_name: entity.full_name,
        [idField]: entity[idField],
        email: entity.email,
        phone: entity.phone || null,
        department: entity.department || null,
        national_id: entity.national_id,
        status: entity.status,
      },
    });
  });

  app.post(`/${type}/members/verify-extended`, (req, res) => {
    const identifier = req.body?.member_id || req.body?.national_id;
    const entity = system.getEntities().find(e =>
      e.national_id === identifier || e[idField] === identifier || e.email === identifier
    );
    if (!entity || entity.status !== 'active') {
      return res.json({ is_eligible: false, reason: 'Member not found or inactive' });
    }
    res.json({
      is_eligible: true,
      data: {
        personal: { full_name: entity.full_name, national_id: entity.national_id, email: entity.email, phone: entity.phone },
        organization: { type, name: system.orgName, department: entity.department },
        membership: { number: entity[idField], status: entity.status },
      },
    });
  });
}

// ─── Error Handling ─────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    hint: 'See /api/v1/registry/organizations for available endpoints',
  });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ═══════════════════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  const totalEntities = Object.values(orgSystems).reduce((s, o) => s + o.getEntities().length, 0);
  const totalCreds = Object.values(orgSystems).reduce((s, o) => s + o.getCredentials().length, 0);

  console.log('');
  console.log('═'.repeat(60));
  console.log('  Federated Organization Integration Platform v4.0.0');
  console.log('═'.repeat(60));
  console.log(`  Server:     http://localhost:${PORT}`);
  console.log(`  Platform Key: ${PLATFORM_API_KEY}`);
  console.log('');
  console.log('  ┌─ Organizations ──────────────────────────────────────┐');
  for (const [type, system] of Object.entries(orgSystems)) {
    const entities = system.getEntities();
    const active = entities.filter(e => e.status === 'active').length;
    console.log(`  │ ${type.padEnd(12)} ${system.orgName.padEnd(35)} │`);
    console.log(`  │ ${''.padEnd(12)} Entities: ${String(entities.length).padStart(3)} (${active} active)  API Key: ${system.apiKey}  │`);
    console.log(`  │ ${''.padEnd(12)} Base URL: /orgs/${type}/api/v1                              │`);
  }
  console.log('  └──────────────────────────────────────────────────────┘');
  console.log('');
  console.log('  📊 Platform Summary:');
  console.log(`     Organizations: ${Object.keys(orgSystems).length}`);
  console.log(`     Total Entities: ${totalEntities}`);
  console.log(`     Total Credentials: ${totalCreds}`);
  console.log('');
  console.log('  🔌 Unified Platform Endpoints:');
  console.log(`     GET  /api/v1/health                    — Platform health`);
  console.log(`     GET  /api/v1/registry/organizations    — Service discovery`);
  console.log(`     GET  /api/v1/search                    — Cross-org search`);
  console.log(`     GET  /api/v1/unified/entities          — Aggregated entity view`);
  console.log(`     GET  /api/v1/events                    — Global event stream`);
  console.log(`     POST /api/v1/webhooks/ingest           — Event ingestion`);
  console.log(`     GET  /api/v1/dashboard                 — Platform stats`);
  console.log('');
  console.log('  🏛️  Per-Organization API (standardized contract):');
  console.log('     Replace {org} with: university, government, employer, hospital, financial');
  console.log('');
  console.log('     GET  /orgs/{org}/api/v1/health                    — Org health');
  console.log('     GET  /orgs/{org}/api/v1/organizations/profile     — Org profile');
  console.log('     GET  /orgs/{org}/api/v1/entities/search           — Search entities');
  console.log('     GET  /orgs/{org}/api/v1/entities/:id              — Entity detail');
  console.log('     GET  /orgs/{org}/api/v1/credentials               — List credentials');
  console.log('     POST /orgs/{org}/api/v1/credentials/issue         — Issue credential');
  console.log('     POST /orgs/{org}/api/v1/credentials/:id/revoke    — Revoke credential');
  console.log('     POST /orgs/{org}/api/v1/webhooks/events           — Send webhook event');
  console.log('     GET  /orgs/{org}/api/v1/events                    — Event log');
  console.log('');
  console.log('  🔐 Authentication:');
  console.log('     Platform: X-API-Key: ' + PLATFORM_API_KEY);
  console.log('     Per-Org:  Use each org\'s individual API key shown above');
  console.log('');
  console.log('  📖 Legacy endpoints (Phase 7-9 compat) maintained at /api/*');
  console.log('');
});
