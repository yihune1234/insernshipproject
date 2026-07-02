import logging
from datetime import timedelta

import httpx
from django.conf import settings
from django.utils import timezone

from apps.issuer.models import IntegrationConfig
from apps.trust_registry.services import TrustService

logger = logging.getLogger(__name__)


class ConnectionMonitorService:
    """
    Phase 7: Monitor organization API connection health.
    
    Connection can only be "active" if organization is BOTH approved AND trusted.
    Health checks are for connectivity only, not credential sync.
    """
    
    # Hours after which a connection becomes "unknown" without a successful check
    STALENESS_HOURS = 24
    
    @classmethod
    def check_health(cls, organization) -> str:
        """
        Check organization API connection health.
        
        Requirements:
        - Organization must be approved (Phase 5)
        - Organization must be currently trusted (Phase 6)
        - Connection endpoint must respond (any status < 500)
        - Must succeed within timeout
        
        Args:
            organization: Organization instance
            
        Returns:
            str: Health status ("healthy", "degraded", "unreachable", "unknown")
        """
        from apps.issuer.services.integration_management_service import IntegrationManagementService
        
        config = IntegrationManagementService.get_or_create_config(organization)
        
        # Requirement: Organization must be approved (Phase 5)
        if organization.status != "approved":
            config.connection_health = "unknown"
            config.save(update_fields=["connection_health"])
            logger.info(f"Organization {organization.name} not approved, cannot check health")
            return "unknown"
        
        # Requirement: Organization must be currently trusted (Phase 6 - live check)
        try:
            if not TrustService.is_trusted(organization):
                config.connection_health = "unknown"
                config.save(update_fields=["connection_health"])
                logger.info(f"Organization {organization.name} not trusted, cannot check health")
                return "unknown"
        except Exception as e:
            config.connection_health = "unknown"
            config.save(update_fields=["connection_health"])
            logger.info(f"Organization {organization.name} trust check failed: {e}")
            return "unknown"
        
        # Organization is both approved and trusted, now check connectivity
        base_url = config.base_url or organization.base_api_url
        if not base_url:
            config.connection_health = "unknown"
            config.save(update_fields=["connection_health"])
            logger.info(f"Organization {organization.name} has no base_url configured")
            return "unknown"
        
        # Call organization API to test connectivity
        # Use a simple endpoint that should always exist (e.g., /api/health or /status)
        # This verifies the organization's API is reachable, not that specific endpoints work
        url = f"{base_url.rstrip('/')}/api/health"
        headers = {}
        if config.api_key:
            header_name = config.api_key_header_name or "Authorization"
            if config.auth_type == "bearer_token":
                headers[header_name] = f"Bearer {config.api_key}"
            elif config.auth_type == "api_key":
                headers[header_name] = config.api_key
            elif config.auth_type == "custom_header":
                headers[header_name] = config.api_key
        
        try:
            timeout = getattr(settings, 'INTEGRATION_REQUEST_TIMEOUT', 10)
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(url, headers=headers)
            
            # Successful connection if status < 500
            if resp.status_code < 500:
                health = "healthy"
            else:
                health = "degraded"
                
        except httpx.TimeoutException:
            health = "unreachable"
            logger.warning(f"Health check timeout for {organization.name}")
        except Exception as e:
            health = "unreachable"
            logger.warning(f"Health check failed for {organization.name}: {e}")
        
        config.connection_health = health
        config.last_health_check_at = timezone.now()
        config.save(update_fields=["connection_health", "last_health_check_at"])
        
        return health

    @classmethod
    def get_health_status(cls, organization) -> str:
        """
        Get current health status without performing a new check.
        
        Returns "unknown" if no check has been done recently (staleness window).
        
        Args:
            organization: Organization instance
            
        Returns:
            str: Current health status or "unknown" if stale
        """
        if not hasattr(organization, 'integration_config') or not organization.integration_config:
            return "unknown"
        
        config = organization.integration_config
        
        # If no check has been done, status is unknown
        if config.last_health_check_at is None:
            return "unknown"
        
        # If last check is too old (stale), mark as unknown
        staleness_threshold = timezone.now() - timedelta(hours=cls.STALENESS_HOURS)
        if config.last_health_check_at < staleness_threshold:
            return "unknown"
        
        return config.connection_health

    @classmethod
    def check_all_organizations(cls):
        """
        Check health for all organizations with sync enabled.
        
        Returns:
            dict: Summary of health check results
        """
        configs = IntegrationConfig.objects.filter(sync_enabled=True).select_related("organization")
        summary = {"total": 0, "healthy": 0, "degraded": 0, "unreachable": 0, "unknown": 0}
        
        for config in configs:
            health = cls.check_health(config.organization)
            summary["total"] += 1
            summary[health] = summary.get(health, 0) + 1
        
        return summary
