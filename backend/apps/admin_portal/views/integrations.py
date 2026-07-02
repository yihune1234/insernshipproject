from apps.credentials.models import SyncLog
from apps.organizations.models import Organization
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class AdminIntegrationListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        orgs = Organization.objects.filter(integration_enabled=True).order_by("-updated_at")
        data = []
        for org in orgs:
            latest_sync = SyncLog.objects.filter(organization=org).order_by("-started_at").first()
            data.append({
                "organization_id": str(org.id),
                "organization_name": org.name,
                "status": "connected" if latest_sync and latest_sync.status == "completed" else "disconnected",
                "last_sync": latest_sync.completed_at if latest_sync else None,
                "sync_status": latest_sync.status if latest_sync else "never",
                "credentials_processed": latest_sync.credentials_processed if latest_sync else 0,
            })
        return success_response(data=data)


class AdminIntegrationDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            org = Organization.objects.get(id=pk, integration_enabled=True)
            syncs = SyncLog.objects.filter(organization=org).order_by("-started_at")[:10]
            failed_syncs = syncs.filter(status="failed")
            
            sync_data = [
                {
                    "sync_id": str(sync.id),
                    "status": sync.status,
                    "started_at": sync.started_at,
                    "completed_at": sync.completed_at,
                    "credentials_processed": sync.credentials_processed,
                    "error_message": sync.error_message if sync.status == "failed" else None,
                }
                for sync in syncs
            ]
            
            return success_response(data={
                "organization_id": str(org.id),
                "organization_name": org.name,
                "connection_status": "connected" if syncs.filter(status="completed").exists() else "disconnected",
                "total_syncs": syncs.count(),
                "failed_syncs": failed_syncs.count(),
                "recent_syncs": sync_data,
            })
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found or integration not enabled", status_code=404)


class AdminIntegrationRetryView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            org = Organization.objects.get(id=pk, integration_enabled=True)
            # Create a new sync attempt
            sync_log = SyncLog.objects.create(
                organization=org,
                status="pending",
                credentials_processed=0,
            )
            return success_response(data={"sync_id": str(sync_log.id), "status": "pending"})
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
        except Exception as e:
            return error_response(errors=str(e))


class AdminIntegrationDisableView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            org = Organization.objects.get(id=pk, integration_enabled=True)
            org.integration_enabled = False
            org.save(update_fields=["integration_enabled"])
            return success_response(message="Integration disabled")
        except Organization.DoesNotExist:
            return error_response(errors="Organization not found", status_code=404)
