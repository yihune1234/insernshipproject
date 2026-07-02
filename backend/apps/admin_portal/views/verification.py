from django.utils import timezone

from apps.credentials.models import Credential
from apps.verification.models import VerificationHistory
from apps.verification.serializers.result import VerificationHistorySerializer
from common.api_response import success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class AdminVerificationLogsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = VerificationHistory.objects.all().order_by("-verified_at")[:100]
        return success_response(data=VerificationHistorySerializer(logs, many=True).data)


class AdminVerificationStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total = VerificationHistory.objects.count()
        successful = VerificationHistory.objects.filter(result=True).count()
        failed = VerificationHistory.objects.filter(result=False).count()
        revoked = Credential.objects.filter(status="revoked").count()

        return success_response(data={
            "total_verifications": total,
            "successful_verifications": successful,
            "failed_verifications": failed,
            "revoked_credentials": revoked,
            "success_rate": round(successful / total * 100, 2) if total else 0,
        })


class AdminRevokedCredentialsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        revoked = Credential.objects.filter(status="revoked").select_related("holder", "organization").order_by("-revoked_at")[:50]
        data = [
            {
                "credential_id": str(c.credential_id),
                "holder_id": str(c.holder_id) if c.holder_id else None,
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
                "reason": c.revocation_reason,
                "organization": c.organization.name if c.organization else None,
            }
            for c in revoked
        ]
        return success_response(data=data)


class AdminExpiredCredentialsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        expired = Credential.objects.filter(
            expires_at__lt=timezone.now(),
            status="active"
        ).order_by("-expires_at")[:50]

        data = [
            {
                "credential_id": str(c.credential_id),
                "holder_id": str(c.holder_id) if c.holder_id else None,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None,
                "status": "expired",
                "organization": c.organization.name if c.organization else None,
            }
            for c in expired
        ]
        return success_response(data=data)
