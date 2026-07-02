from apps.accounts.models import CustomUser
from apps.organizations.models import Organization
from apps.organizations.models.member import OrganizationMember
from apps.organizations.serializers import (
    AddMemberSerializer,
    OrganizationMemberSerializer,
    OrganizationSerializer,
)
from common.api_response import error_response, success_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


def _get_issuer_member(user):
    return OrganizationMember.objects.select_related("organization").filter(
        user=user, role__in=["owner", "admin", "staff"], is_active=True
    ).first()


class IssuerOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        org = member.organization
        return success_response(data=OrganizationSerializer(org).data)

    def put(self, request):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        org = member.organization
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Organization updated")
        return error_response(errors=serializer.errors)

    def patch(self, request):
        return self.put(request)


class IssuerOrgMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        org = member.organization
        members = OrganizationMember.objects.filter(organization=org, is_active=True).select_related("user")
        return success_response(data=OrganizationMemberSerializer(members, many=True).data)

    def post(self, request):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        if member.role not in ("owner", "admin"):
            return error_response(errors="Only owners and admins can add members", status_code=403)
        org = member.organization
        s = AddMemberSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            user = CustomUser.objects.get(id=s.validated_data["user_id"])
            new_member, created = OrganizationMember.objects.get_or_create(
                organization=org, user=user,
                defaults={"role": s.validated_data["role"], "is_active": True},
            )
            if not created:
                new_member.is_active = True
                new_member.role = s.validated_data["role"]
                new_member.save(update_fields=["is_active", "role"])
            return success_response(
                data=OrganizationMemberSerializer(new_member).data,
                message="Member added successfully",
                status_code=201,
            )
        except CustomUser.DoesNotExist:
            return error_response(errors="User not found", status_code=404)


class IssuerOrgMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        if member.role not in ("owner", "admin"):
            return error_response(errors="Only owners and admins can remove members", status_code=403)
        target = OrganizationMember.objects.filter(user__id=user_id, organization=member.organization).first()
        if not target:
            return error_response(errors="Member not found", status_code=404)
        target.is_active = False
        target.save(update_fields=["is_active"])
        return success_response(message="Member removed")

    def patch(self, request, user_id):
        member = _get_issuer_member(request.user)
        if not member:
            return error_response(errors="Organization not found", status_code=404)
        if member.role not in ("owner", "admin"):
            return error_response(errors="Only owners and admins can update members", status_code=403)
        target = OrganizationMember.objects.filter(user__id=user_id, organization=member.organization).first()
        if not target:
            return error_response(errors="Member not found", status_code=404)
        role = request.data.get("role")
        if role:
            target.role = role
            target.save(update_fields=["role"])
        return success_response(data=OrganizationMemberSerializer(target).data, message="Member updated")
