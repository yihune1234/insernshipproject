import logging

from apps.credentials.models import SyncLog
from apps.credentials.services import IntegrationService
from apps.credentials.services.live_sync_service import LiveSyncService
from apps.issuer.models import IntegrationConfig
from apps.issuer.serializers.integration_config import IntegrationConfigSerializer
from apps.issuer.services import ConnectionMonitorService, IntegrationManagementService
from apps.organizations.models import Organization, OrganizationMember
from common.api_response import error_response, success_response
from common.permissions import IsAdmin, IsIssuer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def _get_issuer_org(user):
    membership = OrganizationMember.objects.filter(user=user, is_active=True).select_related("organization").first()
    return membership.organization if membership else None


class IntegrationConfigListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "admin":
            configs = IntegrationConfig.objects.select_related("organization").all()
        elif request.user.role == "issuer":
            org = _get_issuer_org(request.user)
            if not org:
                return error_response(errors="No organization associated with this account", status_code=403)
            configs = IntegrationConfig.objects.filter(organization=org).select_related("organization")
        else:
            return error_response(errors="Permission denied", status_code=403)
        return success_response(data=IntegrationConfigSerializer(configs, many=True).data)


class IntegrationConfigDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, org):
        if request.user.role == "admin":
            return True
        if request.user.role == "issuer":
            issuer_org = _get_issuer_org(request.user)
            return issuer_org and issuer_org.id == org.id
        return False

    def get(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
        if not self._check_access(request, org):
            return error_response(errors="Permission denied", status_code=403)
        config = IntegrationManagementService.get_or_create_config(org)
        return success_response(data=IntegrationConfigSerializer(config).data)

    def put(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
        if not self._check_access(request, org):
            return error_response(errors="Permission denied", status_code=403)
        config = IntegrationManagementService.get_or_create_config(org)
        s = IntegrationConfigSerializer(config, data=request.data, partial=True)
        if not s.is_valid():
            return error_response(errors=s.errors)
        s.save()
        return success_response(data=s.data)


class IntegrationSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
        if request.user.role == "issuer":
            issuer_org = _get_issuer_org(request.user)
            if not issuer_org or issuer_org.id != org.id:
                return error_response(errors="Permission denied", status_code=403)
        elif request.user.role != "admin":
            return error_response(errors="Permission denied", status_code=403)
        try:
            result = IntegrationService.sync_organization(org)
            IntegrationManagementService.record_successful_sync(org)
            return success_response(data={
                "processed": result.processed,
                "created": result.created,
                "updated": result.updated,
                "failed": result.failed,
            })
        except Exception:
            logger.exception("Integration sync failed for org %s", org_id)
            return error_response(errors="An unexpected error occurred during sync")


class LiveSyncTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role == "admin":
            org_id = request.data.get("org_id") or request.query_params.get("org_id")
            if not org_id:
                return error_response(errors="Admin must supply org_id", status_code=400)
            try:
                org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                return error_response(errors="Organization not found", status_code=404)
        elif request.user.role == "issuer":
            org = _get_issuer_org(request.user)
            if not org:
                return error_response(errors="No organization associated with this account", status_code=403)
        else:
            return error_response(errors="Permission denied", status_code=403)

        try:
            result = LiveSyncService.sync(org)
            if result.errors and result.processed == 0:
                IntegrationManagementService.record_failed_sync(org, result.errors[0])
                return error_response(errors=result.errors[0], status_code=502)
            IntegrationManagementService.record_successful_sync(org)
            return success_response(data={
                "processed": result.processed,
                "created": result.created,
                "updated": result.updated,
                "failed": result.failed,
                "skipped": result.skipped,
                "errors": result.errors,
            })
        except Exception:
            logger.exception("Live sync failed for org")
            return error_response(errors="An unexpected error occurred during live sync", status_code=502)


class SyncLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "admin":
            logs = SyncLog.objects.select_related("organization").order_by("-started_at")[:50]
        elif request.user.role == "issuer":
            org = _get_issuer_org(request.user)
            if not org:
                return error_response(errors="No organization associated with this account", status_code=403)
            logs = SyncLog.objects.filter(organization=org).order_by("-started_at")[:50]
        else:
            return error_response(errors="Permission denied", status_code=403)

        data = [
            {
                "id": str(log.id),
                "organization": log.organization.name,
                "sync_type": log.sync_type,
                "status": log.status,
                "credentials_processed": log.credentials_processed,
                "credentials_created": log.credentials_created,
                "credentials_updated": log.credentials_updated,
                "credentials_failed": log.credentials_failed,
                "error_message": log.error_message,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
            }
            for log in logs
        ]
        return success_response(data={"results": data, "count": len(data)})


class IntegrationHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
        if request.user.role == "issuer":
            issuer_org = _get_issuer_org(request.user)
            if not issuer_org or issuer_org.id != org.id:
                return error_response(errors="Permission denied", status_code=403)
        elif request.user.role != "admin":
            return error_response(errors="Permission denied", status_code=403)
        health = ConnectionMonitorService.check_health(org)
        return success_response(data={"health": health})
