import logging

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, ValidationError):
        return Response(
            {"success": False, "errors": exc.detail, "message": "Validation error"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response(
            {"success": False, "errors": str(exc.detail), "message": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if isinstance(exc, PermissionDenied):
        return Response(
            {"success": False, "errors": str(exc.detail), "message": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if isinstance(exc, NotFound):
        return Response(
            {"success": False, "errors": str(exc.detail), "message": "Not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    if isinstance(exc, MethodNotAllowed):
        return Response(
            {"success": False, "errors": str(exc.detail), "message": "Method not allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    if response is not None:
        return Response(
            {"success": False, "errors": response.data, "message": "Request error"},
            status=response.status_code,
        )

    if not settings.DEBUG:
        logger.exception("Unhandled exception", exc_info=exc)
        return Response(
            {"success": False, "errors": "Internal server error", "message": "Server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return None
