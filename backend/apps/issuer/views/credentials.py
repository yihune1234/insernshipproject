from django.utils.dateparse import parse_datetime

from apps.credentials.models import Credential
from apps.credentials.services import CredentialService
from apps.issuer.views.integration import _get_issuer_org
from apps.organizations.models import OrganizationMember
from common.api_response import error_response, success_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class IssuerCredentialView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)
        status_filter = request.query_params.get("status")
        qs = Credential.objects.filter(organization=org).order_by("-created_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        from apps.credentials.serializers import CredentialSerializer
        return success_response(data=CredentialSerializer(qs, many=True).data)

    def post(self, request):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)
        from apps.issuer.serializers.credential import IssueCredentialSerializer
        s = IssueCredentialSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors, status_code=400)
        data = s.validated_data
        credential = CredentialService.save(organization=org, data=data)
        from apps.credentials.serializers import CredentialSerializer
        return success_response(
            data=CredentialSerializer(credential).data,
            message="Credential issued successfully",
            status_code=201,
        )


class IssuerCredentialBulkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)
        items = request.data.get("credentials", [])
        if not items or not isinstance(items, list):
            return error_response(errors="'credentials' must be a non-empty array", status_code=400)
        from apps.credentials.serializers import CredentialSerializer
        results = {"created": 0, "failed": 0, "errors": []}
        for item in items:
            try:
                cred = CredentialService.save(organization=org, data=item)
                results["created"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(str(e))
        return success_response(data=results, message=f"Bulk issue: {results['created']} created, {results['failed']} failed")


class IssuerCredentialStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, credential_id):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)
        try:
            cred = Credential.objects.get(credential_id=credential_id, organization=org)
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)
        new_status = request.data.get("status")
        if not new_status:
            return error_response(errors="'status' field is required", status_code=400)
        reason = request.data.get("reason", "")
        try:
            cred = CredentialService.update_status(cred, new_status, reason=reason)
            from apps.credentials.serializers import CredentialSerializer
            return success_response(data=CredentialSerializer(cred).data, message=f"Credential status updated to {new_status}")
        except Exception as e:
            return error_response(errors=str(e), status_code=400)
