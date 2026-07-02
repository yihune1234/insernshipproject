from django.utils.dateparse import parse_datetime

from apps.credentials.models import Credential
from apps.credentials.serializers import CredentialSerializer
from apps.credentials.services import CredentialService, IntegrationService, SyncService
from apps.organizations.models import Organization
from apps.trust_registry.services import TrustService
from apps.verification.services.verification_engine import VerificationEngine
from common.api_response import error_response, success_response
from common.permissions import IsHolder
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class CredentialListView(APIView):
    permission_classes = [IsHolder]

    def get(self, request):
        status = request.query_params.get("status")
        updated_since = request.query_params.get("updated_since")
        if updated_since:
            updated_since = parse_datetime(updated_since)
        qs = CredentialService.get_for_holder(request.user, status=status, updated_since=updated_since)
        return success_response(data=CredentialSerializer(qs, many=True).data)


class CredentialDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request, credential_id):
        try:
            cred = Credential.objects.get(credential_id=credential_id)
            if cred.holder != request.user:
                return error_response(errors="Access denied", status_code=403)
            return success_response(data=CredentialSerializer(cred).data)
        except Credential.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def put(self, request, credential_id):
        try:
            cred = Credential.objects.get(credential_id=credential_id)
            if cred.holder != request.user:
                return error_response(errors="Access denied", status_code=403)
            cred = CredentialService.update(cred, request.data)
            return success_response(data=CredentialSerializer(cred).data, message="Credential updated")
        except Credential.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def patch(self, request, credential_id):
        return self.put(request, credential_id)

    def delete(self, request, credential_id):
        try:
            cred = Credential.objects.get(credential_id=credential_id)
            if cred.holder != request.user:
                return error_response(errors="Access denied", status_code=403)
            cred.delete()
            return success_response(message="Credential deleted")
        except Credential.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class PublicVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential_id = request.data.get("credential_id")
        if not credential_id:
            return error_response(errors="credential_id is required")
        result = VerificationEngine.verify(credential_id=credential_id, requesting_user=None)
        return success_response(data=result)


class SyncView(APIView):
    permission_classes = [IsHolder]

    def post(self, request):
        orgs = Organization.objects.filter(
            credentials__holder=request.user
        ).distinct()
        results = []
        for org in orgs:
            if TrustService.is_trusted(org):
                r = IntegrationService.sync_organization(org)
                results.append({"org": org.name, "created": r.created, "updated": r.updated})
        return success_response(data={"synced": results})
