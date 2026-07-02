import logging

from apps.credentials.models import Credential, SyncLog
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from django.db.models import Count, Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.organizations.models import OrganizationMember

logger = logging.getLogger(__name__)


def _get_issuer_org(user):
    membership = OrganizationMember.objects.filter(user=user, is_active=True).select_related("organization").first()
    return membership.organization if membership else None


class IntegrationAnalyticsView(APIView):
    """
    GET /api/v1/integration/analytics/

    - Admin: returns global platform-wide statistics.
    - Issuer: returns statistics scoped to their own organization.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "admin":
            from apps.issuer.models import IntegrationConfig
            total_orgs = IntegrationConfig.objects.count()
            healthy = IntegrationConfig.objects.filter(connection_health="healthy").count()
            active_holders = Credential.objects.filter(status="active").values("holder").distinct().count()
            total_credentials = Credential.objects.count()
            logs = SyncLog.objects.values("organization__name").annotate(
                total_syncs=Count("id"),
                total_processed=Sum("credentials_processed"),
            )[:20]
            return success_response(data={
                "total_integrations": total_orgs,
                "healthy_connections": healthy,
                "active_holders": active_holders,
                "total_credentials": total_credentials,
                "recent_sync_stats": list(logs),
            })

        elif request.user.role == "issuer":
            org = _get_issuer_org(request.user)
            if not org:
                return error_response(errors="No organization associated with this account", status_code=403)

            from apps.issuer.models import IntegrationConfig
            try:
                config = IntegrationConfig.objects.get(organization=org)
                connection_health = config.connection_health
                total_integrations = 1
                healthy_connections = 1 if connection_health == "healthy" else 0
            except IntegrationConfig.DoesNotExist:
                connection_health = "unknown"
                total_integrations = 0
                healthy_connections = 0

            active_holders = (
                Credential.objects.filter(organization=org, status="active")
                .values("holder")
                .distinct()
                .count()
            )
            total_credentials = Credential.objects.filter(organization=org).count()

            logs = (
                SyncLog.objects.filter(organization=org)
                .values("organization__name")
                .annotate(
                    total_syncs=Count("id"),
                    total_processed=Sum("credentials_processed"),
                )[:20]
            )
            return success_response(data={
                "total_integrations": total_integrations,
                "healthy_connections": healthy_connections,
                "active_holders": active_holders,
                "total_credentials": total_credentials,
                "recent_sync_stats": list(logs),
            })

        return error_response(errors="Permission denied", status_code=403)


class OrgIntegrationAnalyticsView(APIView):
    """
    GET /api/v1/integration/analytics/{org_id}/

    - Admin: any org
    - Issuer: own org only
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        if request.user.role == "issuer":
            issuer_org = _get_issuer_org(request.user)
            if not issuer_org or str(issuer_org.id) != str(org_id):
                return error_response(errors="Permission denied", status_code=403)
        elif request.user.role != "admin":
            return error_response(errors="Permission denied", status_code=403)

        logs = SyncLog.objects.filter(organization_id=org_id).order_by("-started_at")[:10]
        data = [
            {
                "sync_type": l.sync_type,
                "status": l.status,
                "processed": l.credentials_processed,
                "created": l.credentials_created,
                "updated": l.credentials_updated,
                "failed": l.credentials_failed,
                "started_at": l.started_at.isoformat() if l.started_at else None,
            }
            for l in logs
        ]
        return success_response(data=data)
