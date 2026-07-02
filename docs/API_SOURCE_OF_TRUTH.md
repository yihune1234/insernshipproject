# API Source of Truth

The backend OpenAPI schema is the single source of truth for API contracts.

## Generate the schema

```bash
cd /home/runner/work/digital/digital/backend2
python manage.py spectacular --file openapi-schema.yaml
```

## What CI validates

- Backend crypto and verification route contract tests
- OpenAPI schema generation
- Frontend lint, build, and smoke-import tests
- Holder app lint and core service tests

Current note: frontend full TypeScript build and holder app lint are wired into CI as visibility checks, but they remain non-blocking until the existing legacy errors outside this change set are cleaned up.

## Contract conventions

- Verification APIs are under `/api/verification/` (singular)
- Mobile QR flows must accept backend links shaped like `/verify/p/<uuid>`
- Frontend and mobile changes should be checked against the generated schema before release
