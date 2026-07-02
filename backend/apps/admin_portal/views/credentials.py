from django.db.models import Count, Q

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential, SyncLog
from apps.credentials.serializers import CredentialSerializer
from common.api_response import success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class AdminSynchronizedCredentialsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        creds = Credential.objects.filter(
            sync_source="organization_api", last_synced_at__isnull=False
        ).select_related("holder", "organization").order_by("-last_synced_at")[:50]

        return success_response(data=CredentialSerializer(creds, many=True).data)


class AdminCredentialStatusView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        status_dist = Credential.objects.values("status").annotate(count=Count("id"))
        sync_source_dist = Credential.objects.values("sync_source").annotate(count=Count("id"))

        return success_response(data={
            "by_status": list(status_dist),
            "by_sync_source": list(sync_source_dist),
            "total": Credential.objects.count(),
            "active": Credential.objects.filter(status="active").count(),
            "revoked": Credential.objects.filter(status="revoked").count(),
            "synced": Credential.objects.filter(sync_source="organization_api").count(),
        })


class AdminHolderManagementView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_holders = CustomUser.objects.filter(role="holder").count()
        holders_with_creds = Credential.objects.filter(
            sync_source="organization_api", last_synced_at__isnull=False
        ).values("holder_id").distinct().count()

        holder_stats = CustomUser.objects.filter(
            role="holder"
        ).annotate(
            credential_count=Count("credentials"),
            active_count=Count("credentials", filter=Q(credentials__status="active")),
            revoked_count=Count("credentials", filter=Q(credentials__status="revoked")),
        ).order_by("-credential_count")[:20]

        data = [
            {
                "holder_id": str(h.id),
                "email": h.email,
                "total_credentials": h.credential_count,
                "active_credentials": h.active_count,
                "revoked_credentials": h.revoked_count,
                "status": "active" if h.is_active else "inactive",
            }
            for h in holder_stats
        ]

        return success_response(data={
            "total_holders": total_holders,
            "synchronized_holders": holders_with_creds,
            "sync_rate": round(holders_with_creds / total_holders * 100, 2) if total_holders else 0,
            "top_holders": data,
        })
