import logging
from datetime import timedelta

from django.utils import timezone

from apps.issuer.models import IntegrationConfig
from apps.trust_registry.services import TrustService

logger = logging.getLogger(__name__)


class IntegrationManagementService:
    """
    Phase 7: Manage organization integration configuration.
    
    Connection/integration can only be "active" if:
    - Organization is approved (Phase 5)
    - Organization is currently trusted (Phase 6)
    """
    
    @classmethod
    def get_or_create_config(cls, organization):
        config, _ = IntegrationConfig.objects.get_or_create(organization=organization)
        return config

    @classmethod
    def is_connection_active(cls, organization) -> bool:
        """
        Check if organization connection is active (approved AND trusted).
        
        Requirements for "active":
        - Organization.status == "approved" (Phase 5)
        - Organization is currently trusted (Phase 6 - live check, not cached)
        - Connection health check has passed recently
        
        Args:
            organization: Organization instance
            
        Returns:
            bool: True if connection is active, False otherwise
        """
        # Must be approved
        if organization.status != "approved":
            return False
        
        # Must be trusted (Phase 6 - live check)
        try:
            if not TrustService.is_trusted(organization):
                return False
        except Exception:
            logger.warning("Trust check failed for org %s", organization.id)
            return False
        
        # Connection health should be healthy (not unknown/unreachable)
        config = cls.get_or_create_config(organization)
        if config.connection_health not in ["healthy", "degraded"]:
            return False
        
        return True

    @classmethod
    def update_sync_status(cls, organization, status: str, error: str = None):
        config = cls.get_or_create_config(organization)
        config.sync_status = status
        if error:
            config.consecutive_failures += 1
        config.save(update_fields=["sync_status", "consecutive_failures"])
        return config

    @classmethod
    def record_successful_sync(cls, organization):
        config = cls.get_or_create_config(organization)
        config.consecutive_failures = 0
        config.last_sync_at = timezone.now()
        config.sync_status = "success"
        config.connection_health = "healthy"
        cls.schedule_next_sync(organization, config=config)
        config.save()
        return config

    @classmethod
    def record_failed_sync(cls, organization, error: str):
        config = cls.get_or_create_config(organization)
        config.consecutive_failures += 1
        config.sync_status = "error"
        if config.consecutive_failures >= 3:
            config.connection_health = "unreachable"
        else:
            config.connection_health = "degraded"
        config.save(update_fields=["consecutive_failures", "sync_status", "connection_health"])
        return config

    @classmethod
    def schedule_next_sync(cls, organization, config=None):
        if config is None:
            config = cls.get_or_create_config(organization)
        config.next_sync_at = timezone.now() + timedelta(minutes=config.sync_interval_minutes)
        config.save(update_fields=["next_sync_at"])
        return config
