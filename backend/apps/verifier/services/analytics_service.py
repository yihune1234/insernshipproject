from django.db.models import Count
from django.utils import timezone


class AnalyticsService:
    @classmethod
    def get_stats(cls, verifier_user, date_from=None, date_to=None):
        from apps.verification.models import VerificationHistory
        qs = VerificationHistory.objects.filter(verifier=verifier_user)
        if date_from:
            qs = qs.filter(verified_at__gte=date_from)
        if date_to:
            qs = qs.filter(verified_at__lte=date_to)
        total = qs.count()
        successful = qs.filter(result=True).count()
        success_rate = round(successful / total * 100, 2) if total else 0
        top_types = list(
            qs.values("credential_type").annotate(count=Count("id")).order_by("-count")[:10]
        )
        return {
            "total_verifications": total,
            "successful_verifications": successful,
            "success_rate": success_rate,
            "top_credential_types": top_types,
        }
