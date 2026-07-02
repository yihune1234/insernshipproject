import logging

from config.celery_app import app

logger = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_organization_credentials_task(self, organization_id: str):
    try:
        from apps.credentials.services import IntegrationService
        from apps.issuer.services import IntegrationManagementService
        from apps.organizations.models import Organization
        org = Organization.objects.get(id=organization_id)
        result = IntegrationService.sync_organization(org)
        IntegrationManagementService.record_successful_sync(org)
        logger.info("Synced org %s: +%d created, +%d updated", org.name, result.created, result.updated)
        return {"created": result.created, "updated": result.updated, "failed": result.failed}
    except Exception as exc:
        logger.error("Sync failed for org %s: %s", organization_id, exc)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=1)
def sync_all_organizations_task(self):
    from apps.credentials.services import SyncService
    try:
        result = SyncService.sync_all()
        logger.info("Global sync complete: %s", result)
        return result
    except Exception as exc:
        logger.error("Global sync failed: %s", exc)
        raise


@app.task(bind=True, max_retries=2, default_retry_delay=120)
def fetch_revocation_lists_task(self):
    from apps.credentials.services import IntegrationService
    from apps.organizations.models import Organization
    orgs = Organization.objects.filter(status="approved")
    for org in orgs:
        try:
            IntegrationService.fetch_revocation_list(org)
        except Exception as e:
            logger.warning("Revocation list fetch failed for %s: %s", org.name, e)
