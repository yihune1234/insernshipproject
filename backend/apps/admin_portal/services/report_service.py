from django.db.models import Count, Sum

from apps.credentials.models import SyncLog
from apps.organizations.models import Organization
from apps.verification.models import VerificationHistory


class ReportService:
    @classmethod
    def synchronization_report(cls, date_from=None, date_to=None):
        """Generate synchronization statistics report"""
        qs = SyncLog.objects.all()
        if date_from:
            qs = qs.filter(started_at__gte=date_from)
        if date_to:
            qs = qs.filter(started_at__lte=date_to)

        return {
            "total_syncs": qs.count(),
            "successful": qs.filter(status="completed").count(),
            "failed": qs.filter(status="failed").count(),
            "total_processed": qs.aggregate(s=Sum("credentials_processed"))["s"] or 0,
            "by_status": dict(qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")),
        }

    @classmethod
    def organization_report(cls, date_from=None, date_to=None):
        """Generate organization management statistics"""
        qs = Organization.objects.all()
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        return {
            "total_organizations": qs.count(),
            "approved": qs.filter(status="approved").count(),
            "suspended": qs.filter(status="suspended").count(),
            "pending": qs.filter(status="pending").count(),
            "integration_enabled": qs.filter(integration_enabled=True).count(),
            "by_status": dict(qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")),
        }

    @classmethod
    def verification_report(cls, date_from=None, date_to=None):
        """Generate verification statistics report"""
        qs = VerificationHistory.objects.all()
        if date_from:
            qs = qs.filter(verified_at__gte=date_from)
        if date_to:
            qs = qs.filter(verified_at__lte=date_to)

        total = qs.count()
        successful = qs.filter(result=True).count()
        return {
            "total": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": round(successful / total * 100, 2) if total else 0,
        }

    @classmethod
    def integration_report(cls, date_from=None, date_to=None):
        """Generate integration health report"""
        qs = SyncLog.objects.all()
        if date_from:
            qs = qs.filter(started_at__gte=date_from)
        if date_to:
            qs = qs.filter(started_at__lte=date_to)

        failed = qs.filter(status="failed").count()
        total = qs.count()

        return {
            "total_sync_attempts": total,
            "failed_syncs": failed,
            "health_score": round((total - failed) / total * 100, 2) if total else 100,
            "recent_failures": list(qs.filter(status="failed").values_list("organization_id", flat=True).distinct()),
        }

    @classmethod
    def audit_report(cls, date_from=None, date_to=None):
        """Generate audit trail report for platform actions"""
        org_qs = Organization.objects.all()
        if date_from:
            org_qs = org_qs.filter(updated_at__gte=date_from)
        if date_to:
            org_qs = org_qs.filter(updated_at__lte=date_to)

        verify_qs = VerificationHistory.objects.all()
        if date_from:
            verify_qs = verify_qs.filter(verified_at__gte=date_from)
        if date_to:
            verify_qs = verify_qs.filter(verified_at__lte=date_to)

        return {
            "organization_actions": org_qs.count(),
            "verification_actions": verify_qs.count(),
            "total_actions": org_qs.count() + verify_qs.count(),
        }
