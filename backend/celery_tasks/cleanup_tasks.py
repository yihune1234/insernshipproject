import logging
from datetime import timedelta

from config.celery_app import app
from django.utils import timezone

logger = logging.getLogger(__name__)


@app.task
def expire_credentials_task():
    from apps.credentials.models import Credential
    now = timezone.now()
    expired = Credential.objects.filter(expires_at__lt=now, status="active")
    count = expired.count()
    expired.update(status="expired")
    logger.info("Expired %d credentials", count)
    return {"expired": count}


@app.task
def cleanup_old_audit_logs_task(days: int = 365):
    from apps.audit.models import AuditLog
    cutoff = timezone.now() - timedelta(days=days)
    deleted, _ = AuditLog.objects.filter(created_at__lt=cutoff).delete()
    logger.info("Deleted %d old audit logs", deleted)
    return {"deleted": deleted}


@app.task
def cleanup_expired_shares_task():
    from apps.holder.models import CredentialShare
    now = timezone.now()
    expired = CredentialShare.objects.filter(expires_at__lt=now, is_active=True)
    count = expired.count()
    expired.update(is_active=False)
    logger.info("Expired %d credential shares", count)
    return {"expired_shares": count}


@app.task
def generate_platform_stats_task():
    from apps.admin_portal.services import StatsService
    stats = StatsService.get_or_create_daily_stats()
    logger.info("Generated platform stats for %s", stats.stat_date)
