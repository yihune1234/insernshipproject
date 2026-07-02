from django.utils.dateparse import parse_datetime

from apps.credentials.models import Credential
from apps.credentials.serializers import CredentialSerializer
from apps.credentials.services import CredentialService, IntegrationService
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.services import TrustService
from common.api_response import error_response, success_response
from common.permissions import IsHolder
from rest_framework.views import APIView


class HolderCredentialListView(APIView):
    """GET /wallet/credentials/ and alias /wallet/my-credentials/"""
    permission_classes = [IsHolder]

    def get(self, request):
        status = request.query_params.get("status")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 50))
        updated_since = request.query_params.get("updated_since")
        if updated_since:
            updated_since = parse_datetime(updated_since)
        qs = CredentialService.get_for_holder(request.user, status=status, updated_since=updated_since)
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_qs = qs[start:end]
        data = CredentialSerializer(page_qs, many=True).data
        return success_response(data={
            "results": data,
            "count": total,
            "next": end < total,
            "previous": page > 1,
        })


class HolderCredentialDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request, pk):
        try:
            cred = Credential.objects.get(id=pk, holder=request.user)
            return success_response(data=CredentialSerializer(cred).data)
        except Credential.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class HolderSyncView(APIView):
    permission_classes = [IsHolder]

    def post(self, request):
        orgs = Organization.objects.filter(
            credentials__holder=request.user, status="approved"
        ).distinct()
        results = []
        for org in orgs:
            if TrustService.is_trusted(org):
                r = IntegrationService.sync_organization(org)
                results.append({"org": org.name, "created": r.created, "updated": r.updated})
        return success_response(data={"synced": results})


class HolderCredentialRequestView(APIView):
    permission_classes = [IsHolder]

    def post(self, request):
        return success_response(data={"message": "Credential request submitted"}, status_code=202)


class HolderRequestCatalogView(APIView):
    """GET /wallet/request-catalog/ — catalog of org types, orgs, and credential types."""
    permission_classes = [IsHolder]

    def get(self, request):
        org_types = OrganizationType.objects.filter(is_active=True)
        org_type_data = []
        all_cred_types = set()
        for ot in org_types:
            orgs = Organization.objects.filter(org_type=ot, status="approved")
            orgs_data = []
            for org in orgs:
                ctype_names = (
                    Credential.objects.filter(organization=org)
                    .values_list("credential_type", flat=True)
                    .distinct()
                )
                ct_data = [
                    {"id": ctype, "name": ctype}
                    for ctype in ctype_names if ctype
                ]
                all_cred_types.update(ct["id"] for ct in ct_data)
                org_did = ""
                try:
                    org_did = str(org.did.did_string) if hasattr(org, "did") and org.did else ""
                except Exception:
                    pass
                orgs_data.append({
                    "id": str(org.id),
                    "name": org.name,
                    "organization_did": org_did,
                    "credential_types": ct_data,
                })
            org_type_data.append({
                "id": str(ot.id),
                "name": ot.name,
                "description": getattr(ot, "description", ""),
                "organizations": orgs_data,
            })
        return success_response(data={
            "organization_types": org_type_data,
            "credential_types": [
                {"id": ct_name, "name": ct_name}
                for ct_name in sorted(all_cred_types)
            ],
        })
