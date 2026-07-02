---
name: Backend Layout
description: Active backend directory, thin routing app pattern, and port binding required for Replit workflow detection.
---

## Active backend directory
`backend/` — the live, spec-aligned backend. `backend2/` is the legacy origin; do not run or edit it.

## Directory structure
```
backend/
  config/
    settings/base.py   ← ROOT_URLCONF = 'config.urls'
    urls.py            ← all spec URL patterns live here
    wsgi.py / asgi.py
  apps/
    accounts/          ← thin routing: /api/auth/
    national_id/       ← thin routing: /api/national-id/
    did/               ← thin routing: /api/did/
    holder/            ← thin routing: /api/wallet/
    issuer/            ← thin routing: /api/issuer/ + credential_type_urls.py + template_urls.py + issuance_urls.py
    verifier/          ← thin routing: /api/verifier/
    notifications/     ← thin routing: /api/notifications/
    oid4vci/           ← thin routing: OIDC discovery
    identity/          ← original app (models, migrations, views) — do not rename
    dids/              ← original app (models, migrations, views)
    credentials/       ← original app (models, migrations, views)
    organizations/     ← original app (models, migrations, views)
    verification/      ← original app (models, migrations, views)
    trust_registry/    ← original app
    audit/             ← original app
    admin_portal/      ← original app
    common/            ← shared utilities
```

## sys.path trick
`config/settings/base.py` does `sys.path.insert(0, str(APPS_DIR))` so all apps in `backend/apps/` are importable by bare module name (e.g. `import identity` not `import apps.identity`).

## Workflow port binding
Django dev server must bind to `0.0.0.0:8000` (not `localhost:8000`) for Replit's workflow port monitor to detect it and mark the workflow as running.

**Why:** Replit scans all interfaces; `localhost` (loopback-only) binding is invisible to the external port scanner, causing the workflow to time out even when the server is actually up.

## Issuer URL split
`issuer/urls.py` → `/api/issuer/` (profile/settings/signatories/notifications)
`issuer/credential_type_urls.py` → `/api/credential-types/`
`issuer/template_urls.py` → `/api/templates/`
`issuer/issuance_urls.py` → `/api/issuance/`

These must be separate `.py` files — Django's `include()` cannot traverse `module.list_name` syntax.

## Legacy aliases kept in config/urls.py
- `api/dids/` → dids.urls
- `api/trust-registry/` → trust_registry.urls
- `api/` → identity.urls, credentials.urls

These exist so any existing client code that hasn't been updated yet continues to work.
