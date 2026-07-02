from apps.organizations.models import Organization
from apps.trust_registry.models import Accreditation
from apps.trust_registry.serializers.accreditation import (
    AccreditationCreateSerializer,
    AccreditationSerializer,
)
from apps.trust_registry.services import TrustService
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class AccreditationListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        accs = Accreditation.objects.select_related("organization").all()
        return success_response(data=AccreditationSerializer(accs, many=True).data)

    def post(self, request):
        s = AccreditationCreateSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            org = Organization.objects.get(id=s.validated_data["organization_id"])
            acc = Accreditation.objects.create(
                organization=org,
                trust_level=s.validated_data["trust_level"],
                trust_score=s.validated_data["trust_score"],
                expires_at=s.validated_data.get("expires_at"),
                notes=s.validated_data.get("notes", ""),
                accredited_by=request.user,
            )
            return success_response(data=AccreditationSerializer(acc).data, status_code=201)
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)


class AccreditationDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            acc = Accreditation.objects.get(id=pk)
            return success_response(data=AccreditationSerializer(acc).data)
        except Accreditation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def put(self, request, pk):
        try:
            acc = Accreditation.objects.get(id=pk)
            s = AccreditationSerializer(acc, data=request.data, partial=True)
            if not s.is_valid():
                return error_response(errors=s.errors)
            s.save()
            return success_response(data=s.data)
        except Accreditation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class AccreditationApproveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            acc = Accreditation.objects.get(id=pk)
            acc.status = "approved"
            acc.accredited_by = request.user
            acc.save(update_fields=["status", "accredited_by"])
            return success_response(data=AccreditationSerializer(acc).data)
        except Accreditation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class AccreditationSuspendView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            acc = Accreditation.objects.get(id=pk)
            acc.status = "suspended"
            acc.save(update_fields=["status"])
            return success_response(data=AccreditationSerializer(acc).data)
        except Accreditation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class TrustCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            is_trusted = TrustService.is_trusted(org)
            return success_response(data={"org_id": str(org_id), "is_trusted": is_trusted})
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
