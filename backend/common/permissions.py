from rest_framework.permissions import BasePermission


class IsHolder(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "holder")


class IsIssuer(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "issuer"
        )


# Deprecated alias for backwards compatibility - use IsIssuer instead
class IsOrganizationUser(IsIssuer):
    pass


class IsVerifier(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "verifier"
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")
