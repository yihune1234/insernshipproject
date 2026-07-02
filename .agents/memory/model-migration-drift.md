---
name: Model-Migration Drift
description: Organization and CredentialType models were rewritten without matching migrations; required RunSQL and RenameField migrations to reconcile.
---

## The Rule

When a Django model is rewritten (fields renamed/removed), the DB schema stays at whatever the last migration left. Tests will fail with `null value in column` or `column does not exist` errors.

**Why:** CredWallet had Organization and CredentialType models rewritten (new field names) without creating corresponding migrations. The legacy DB columns remained with NOT NULL constraints.

**How to apply:**
- When adding a field to a model without a matching migration, create a migration with `AddField` with a `default` so existing rows aren't broken.
- When a legacy column still exists (not in current model) but has NOT NULL constraint, use `RunSQL` to `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL` or `SET DEFAULT`.
- When renaming a ForeignKey attribute in the model (e.g. `issuing_organization` → `organization`), use `RenameField` migration so the DB column is renamed too.
- Always drop the pytest test DB (`DROP DATABASE test_heliumdb`) and recreate fresh after adding migrations; `--reuse-db` will serve the stale schema otherwise.

## Migrations added to fix the drift (reference)

- `organizations/0010` — AddField for email, phone, website, contact_person_name/email, logo, seal, did, approved_by, approved_at, suspended_at/reason, revoked_at/reason
- `organizations/0011` — RunSQL to make legacy orphan columns (is_active, trust_level, etc.) nullable
- `organizations/0012` — RunSQL to make more legacy orphan columns (document_types, issuer_status, etc.) nullable
- `credentials/0017` — RenameField issuing_organization → organization on CredentialType
- `credentials/0018` — AddField category and schema on CredentialType
- `credentials/0019` — RunSQL to make legacy CredentialType columns (version, allowed_organization_type, etc.) nullable

## Serializer fixes

- `admin_portal/serializers.py`: `official_email`/`official_phone`/`website_url` → `email`/`phone`/`website`; `is_active` → `SerializerMethodField` returning `status == 'approved'`
- `organizations/serializers/base_serializers.py`: same Organization field updates
- `credentials/serializers/schema_serializer.py`: removed `version`, `allowed_organization_type`, `render_metadata`, `proof_config`, `revocation_config`, `created_by`, `issuing_organization`; added `organization`
