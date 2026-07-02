from apps.organizations.models import Organization, OrganizationMember
from apps.organizations.serializers import OrganizationSerializer
from common.api_response import error_response, success_response
from common.permissions import IsOrganizationUser
from rest_framework.views import APIView


class OrganizationProfileView(APIView):
    permission_classes = [IsOrganizationUser]

    def _get_org(self, user):
        member = OrganizationMember.objects.filter(user=user, is_active=True).first()
        if not member:
            return None
        return member.organization

    def get(self, request):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Organization not found", status_code=404)
        return success_response(data=OrganizationSerializer(org).data)

    def put(self, request):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Organization not found", status_code=404)
        s = OrganizationSerializer(org, data=request.data, partial=True)
        if not s.is_valid():
            return error_response(errors=s.errors)
        s.save()
        return success_response(data=s.data)


class OrganizationLogoView(APIView):
    permission_classes = [IsOrganizationUser]

    def post(self, request):
        member = OrganizationMember.objects.filter(user=request.user, is_active=True).first()
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        org = member.organization
        if "logo" not in request.FILES:
            return error_response(errors="No logo file provided")
        org.logo = request.FILES["logo"]
        org.save(update_fields=["logo"])
        return success_response(data={"logo": org.logo.url if org.logo else None})
