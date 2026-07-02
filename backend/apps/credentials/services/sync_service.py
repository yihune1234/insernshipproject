import logging

from apps.credentials.services.integration_service import IntegrationService
from apps.organizations.models import Organization
from apps.trust_registry.services import TrustService

logger = logging.getLogger(__name__)


class SyncService:
    """
    Phase 9: Orchestrate credential sync across all approved organizations.
    
    Syncs credentials from organizations that are:
    - Approved (Phase 5)
    - Currently trusted (Phase 6)
    - Have healthy connections (Phase 7)
    """
    
    @classmethod
    def sync_all(cls):
        """
        Sync credentials for all approved organizations.
        
        Only syncs organizations that are currently trusted (Phase 6).
        Phase 7 and Phase 8 validation happens within IntegrationService.sync_organization.
        
        Returns:
            dict: Summary of sync results across all organizations
        """
        orgs = Organization.objects.filter(status="approved")
        summary = {"total": 0, "success": 0, "failed": 0, "skipped": 0, "details": []}
        
        for org in orgs:
            # Check if organization is trusted before attempting sync
            if not TrustService.is_trusted(org):
                summary["skipped"] += 1
                summary["details"].append({
                    "org": org.name,
                    "status": "skipped",
                    "reason": "Organization not trusted"
                })
                continue
            
            summary["total"] += 1
            try:
                result = IntegrationService.sync_organization(org)
                summary["success"] += 1
                summary["details"].append({
                    "org": org.name,
                    "status": "success",
                    "processed": result.processed,
                    "created": result.created,
                    "updated": result.updated,
                    "failed": result.failed,
                })
            except Exception as e:
                summary["failed"] += 1
                summary["details"].append({
                    "org": org.name,
                    "status": "failed",
                    "error": str(e)
                })
                logger.error(f"Sync failed for org {org.name}: {e}")
        
        return summary
    
    @classmethod
    def sync_for_holder(cls, holder, organization):
        """
        Sync credentials for a specific holder at an organization.
        
        Uses Phase 8 holder validation to ensure holder exists at org before sync.
        
        Args:
            holder: Holder user
            organization: Organization to sync from
            
        Returns:
            dict: Sync result
        """
        try:
            result = IntegrationService.sync_organization(holder, organization)
            return {
                "status": "success",
                "processed": result.processed,
                "created": result.created,
                "updated": result.updated,
                "failed": result.failed,
                "errors": result.errors if result.errors else []
            }
        except Exception as e:
            logger.error(f"Sync failed for holder {holder.email} at {organization.name}: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
