from rest_framework.permissions import BasePermission


class IsAccountOwner(BasePermission):
    """Check if user is the account owner."""
    def has_object_permission(self, request, view, obj):
        return obj == request.user


class IsHolder(BasePermission):
    """Check if user has holder role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "holder"


class IsIssuer(BasePermission):
    """Check if user has issuer role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "issuer"


class IsVerifier(BasePermission):
    """Check if user has verifier role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "verifier"


class IsAdmin(BasePermission):
    """Check if user has admin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"


class IsHolderOrAdmin(BasePermission):
    """Check if user has holder or admin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ["holder", "admin"]


class IsNotHolder(BasePermission):
    """Check if user does NOT have holder role (for issuer/verifier/admin only endpoints)."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role != "holder"
