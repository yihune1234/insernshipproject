from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.admin_portal.models import PlatformStats
from apps.credentials.models import SyncLog, Credential
from apps.organizations.models import Organization
from apps.verification.models import VerificationHistory


class StatsService:
    @classmethod
    def get_dashboard_stats(cls):
        return {
            "total_organizations": Organization.objects.count(),
            "active_organizations": Organization.objects.filter(status="approved").count(),
            "connected_organizations": Organization.objects.filter(integration_enabled=True).count(),
            "total_holders": CustomUser.objects.filter(role="holder").count(),
            "synchronized_holders": Credential.objects.filter(sync_status="completed").values("holder_id").distinct().count(),
            "synchronized_credentials": Credential.objects.filter(sync_status="completed").count(),
            "revoked_credentials": Credential.objects.filter(status="revoked").count(),
            "verification_requests": VerificationHistory.objects.count(),
            "successful_verifications": VerificationHistory.objects.filter(result=True).count(),
            "failed_verifications": VerificationHistory.objects.filter(result=False).count(),
            "failed_synchronizations": SyncLog.objects.filter(status="failed").count(),
        }

    @classmethod
    def get_or_create_daily_stats(cls, date=None):
        if date is None:
            date = timezone.now().date()
        stats_data = cls.get_dashboard_stats()
        stats, _ = PlatformStats.objects.update_or_create(
            stat_date=date,
            defaults={
                "total_users": stats_data.get("total_holders", 0),
                "total_organizations": stats_data.get("total_organizations", 0),
                "total_credentials": stats_data.get("synchronized_credentials", 0),
                "active_credentials": stats_data.get("active_organizations", 0),
                "total_verifications": stats_data.get("verification_requests", 0),
                "successful_verifications": stats_data.get("successful_verifications", 0),
            },
        )
        return stats
