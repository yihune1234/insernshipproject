---
name: Token Blacklist Migrations
description: SimpleJWT token_blacklist app requires its own migrations on first setup.
---

## Rule
After adding `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS`, always run `python manage.py migrate` before starting the server.

**Why:** The app ships with 12 migrations that create `OutstandingToken` and `BlacklistedToken` tables. Without them, logout/refresh endpoints that call `token.blacklist()` raise `ProgrammingError`.

## How to apply
- `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True` are both set — every refresh rotates the token and blacklists the old one.
- The `SafeTokenRefreshSerializer` in `identity/serializers/jwt_serializers.py` is used instead of the default to handle edge cases.
