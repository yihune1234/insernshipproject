from apps.accounts.models import CustomUser
from apps.organizations.models import OrganizationMember
from apps.organizations.serializers import AddMemberSerializer, OrganizationMemberSerializer
from common.api_response import error_response, success_response
from common.permissions import IsOrganizationUser
from rest_framework.views import APIView


class MemberListView(APIView):
    permission_classes = [IsOrganizationUser]

    def _get_org(self, user):
        member = OrganizationMember.objects.filter(user=user, is_active=True).first()
        return member.organization if member else None

    def get(self, request):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Not found", status_code=404)
        members = OrganizationMember.objects.filter(organization=org, is_active=True)
        return success_response(data=OrganizationMemberSerializer(members, many=True).data)

    def post(self, request):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Not found", status_code=404)
        s = AddMemberSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            user = CustomUser.objects.get(id=s.validated_data["user_id"])
            member, _ = OrganizationMember.objects.get_or_create(
                organization=org, user=user, defaults={"role": s.validated_data["role"]}
            )
            return success_response(data=OrganizationMemberSerializer(member).data, status_code=201)
        except CustomUser.DoesNotExist:
            return error_response(errors="User not found", status_code=404)


class MemberDetailView(APIView):
    permission_classes = [IsOrganizationUser]

    def _get_org(self, user):
        member = OrganizationMember.objects.filter(user=user, is_active=True).first()
        return member.organization if member else None

    def _get_target(self, org, user_id):
        return OrganizationMember.objects.filter(user__id=user_id, organization=org).first()

    def get(self, request, user_id):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Organization not found", status_code=404)
        target = self._get_target(org, user_id)
        if not target:
            return error_response(errors="Member not found", status_code=404)
        return success_response(data=OrganizationMemberSerializer(target).data)

    def put(self, request, user_id):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Organization not found", status_code=404)
        target = self._get_target(org, user_id)
        if not target:
            return error_response(errors="Member not found", status_code=404)
        role = request.data.get("role")
        if role:
            target.role = role
            target.save(update_fields=["role"])
        return success_response(data=OrganizationMemberSerializer(target).data, message="Member updated")

    def delete(self, request, user_id):
        org = self._get_org(request.user)
        if not org:
            return error_response(errors="Organization not found", status_code=404)
        target = self._get_target(org, user_id)
        if not target:
            return error_response(errors="Member not found", status_code=404)
        target.is_active = False
        target.save(update_fields=["is_active"])
        return success_response(message="Member removed")
