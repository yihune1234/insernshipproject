import hashlib
import hmac

from apps.credentials.models import Credential
from apps.credentials.serializers import CredentialSerializer, ReceiveCredentialSerializer, RevokeCredentialSerializer
from apps.credentials.services import CredentialService, IntegrationService
from common.api_response import error_response, success_response
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView


class OrganizationAPIKeyPermission(BasePermission):
    def has_permission(self, request, view):
        key = request.META.get("HTTP_X_INTEGRATION_KEY")
        if not key:
            return False
        from apps.organizations.models import Organization
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        for org in Organization.objects.filter(status="approved"):
            if org.public_key and hmac.compare_digest(
                hashlib.sha256(org.public_key.encode()).hexdigest(), key_hash
            ):
                request.organization = org
                return True
        return False


class ReceiveCredentialView(APIView):
    permission_classes = [OrganizationAPIKeyPermission]

    def post(self, request):
        s = ReceiveCredentialSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        credential = IntegrationService.receive_credential(request.organization, s.validated_data)
        return success_response(data=CredentialSerializer(credential).data, status_code=201)


class UpdateCredentialView(APIView):
    permission_classes = [OrganizationAPIKeyPermission]

    def post(self, request):
        credential_id = request.data.get("credential_id")
        try:
            cred = Credential.objects.get(credential_id=credential_id, organization=request.organization)
            updated = CredentialService.update(cred, request.data)
            return success_response(data=CredentialSerializer(updated).data)
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)


class RevokeCredentialView(APIView):
    permission_classes = [OrganizationAPIKeyPermission]

    def post(self, request):
        s = RevokeCredentialSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            cred = Credential.objects.get(
                credential_id=s.validated_data["credential_id"],
                organization=request.organization,
            )
            CredentialService.update_status(cred, "revoked", reason=s.validated_data.get("reason"))
            return success_response(message="Credential revoked")
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)
