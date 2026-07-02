from apps.admin_portal.services import ReportService
from common.api_response import success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class SynchronizationReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report = ReportService.synchronization_report(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
        )
        return success_response(data=report)


class OrganizationReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report = ReportService.organization_report(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
        )
        return success_response(data=report)


class VerificationReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report = ReportService.verification_report(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
        )
        return success_response(data=report)


class IntegrationReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report = ReportService.integration_report(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
        )
        return success_response(data=report)


class AuditReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        report = ReportService.audit_report(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
        )
        return success_response(data=report)
