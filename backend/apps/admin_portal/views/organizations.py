import logging

from django.utils import timezone

from apps.organizations.models import Organization, OrgRegistration
from apps.organizations.serializers import OrganizationSerializer, OrgRegistrationSerializer
from apps.organizations.services import OnboardingService
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class AdminOrganizationListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        orgs = Organization.objects.all().order_by("-created_at")
        return success_response(data=OrganizationSerializer(orgs, many=True).data)


class AdminOrganizationPendingView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        pending = OrgRegistration.objects.filter(status="submitted").order_by("-submitted_at")
        return success_response(data=OrgRegistrationSerializer(pending, many=True).data)


class AdminOrganizationDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            org = Organization.objects.get(id=pk)
            return success_response(data=OrganizationSerializer(org).data)
        except Organization.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class AdminOrganizationApproveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            reg = OrgRegistration.objects.get(id=pk, status="submitted")
            org, user = OnboardingService.approve_registration(reg, request.user)
            return success_response(data=OrganizationSerializer(org).data)
        except OrgRegistration.DoesNotExist:
            return error_response(errors="Registration not found or not in submitted state", status_code=404)
        except Exception:
            logger.exception("Organization approval failed")
            return error_response(errors="An unexpected error occurred during approval")


class AdminOrganizationRejectView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            reg = OrgRegistration.objects.get(id=pk, status="submitted")
            reg.status = "rejected"
            reg.rejection_reason = request.data.get("reason", "")
            reg.reviewed_by = request.user
            reg.reviewed_at = timezone.now()
            reg.save()
            return success_response(message="Registration rejected")
        except OrgRegistration.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
