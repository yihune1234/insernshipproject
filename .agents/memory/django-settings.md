---
name: Django Settings Layout
description: Single base.py with environment-driven config; key patterns to follow.
---

## Rule
All settings live in `backend2/digital_wallet/settings/base.py`. Environment-specific behaviour is driven by `DJANGO_ENV` env var (`development` default, `production` for prod).

**Why:** Avoids dev/prod settings split confusion; single file is easier to audit. Production guard at bottom raises `ImproperlyConfigured` for common misconfigs.

## Key patterns
- `CACHES`: Uses `LocMemCache` (no Redis required in dev) when `REDIS_URL` is not set. Circuit breaker in NID service depends on Django cache; must work even without Redis.
- `CORS_ALLOW_ALL_ORIGINS = True` in dev; explicit `CORS_ALLOWED_ORIGINS` list in prod.
- `CSRF_TRUSTED_ORIGINS`: auto-includes `REPLIT_DEV_DOMAIN` env var if set.
- `NID_SIMULATION_MODE`: True by default outside production.
- `CELERY_TASK_ALWAYS_EAGER`: True when no `REDIS_URL` (tasks run synchronously).
- Production guards: `SECRET_KEY`, `DEBUG=False`, explicit `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS=False` — all enforced at import time.
