---
name: DID Model Fields
description: Correct field names on the DID model and how to navigate to DIDKey records
---

## Rules

- The `DID` model field for the DID string is `did_string`, NOT `did`.
- The `DID` model field for publication state is `is_published` (BooleanField), NOT `is_primary`.
- `DIDKey` records live on `DIDDocument`, NOT directly on `DID`. The traversal is:
  - `DID.document` → `DIDDocument` (OneToOneField, related_name="document")
  - `DIDDocument.keys` → queryset of `DIDKey` (ForeignKey reverse)
- Use `DID.objects.create(did_string=..., is_published=True)` when creating.
- In queryset prefetches, use `"document__keys"` not `"keys"`.

**Why:** Multiple views had `d.is_primary` and `d.did` causing 500 errors in production. The model was built with `is_published` / `did_string` but view code used incorrect field names.

**How to apply:** Any time you write code that accesses DID model attributes, check against these names. grep for `\.is_primary` or `\.did[^_]` on DID instances to find bugs.
