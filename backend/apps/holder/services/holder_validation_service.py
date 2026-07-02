"""
Phase 8: Holder Validation Service

Validates that a holder exists in an organization's system before attempting sync.
Implements the required algorithm:
1. Verify holder is holder-role and has verified KYC
2. Verify organization is approved and trusted
3. Verify organization connection is healthy
4. Call org's holder resolve API
5. Verify holder exists and is active
6. Store the holder-to-internal_id mapping
"""

import logging
import httpx
from django.conf import settings
from django.utils import timezone

from apps.holder.models import HolderOrgMapping
from apps.trust_registry.services.trust_service import TrustService, NotAccreditedException
from apps.organizations.models import Organization
from apps.accounts.models import CustomUser

logger = logging.getLogger(__name__)


class HolderValidationException(Exception):
    """Base exception for holder validation failures."""
    pass


class HolderNotVerifiedException(HolderValidationException):
    """Holder does not have verified KYC."""
    pass


class HolderNotFoundAtOrgException(HolderValidationException):
    """Holder does not exist at the organization."""
    pass


class HolderInactiveException(HolderValidationException):
    """Holder exists but is not active at the organization."""
    pass


class OrganizationNotTrustedException(HolderValidationException):
    """Organization is not trusted."""
    pass


class OrganizationConnectionFailedException(HolderValidationException):
    """Organization's connection is known to be failing."""
    pass


class HolderValidationService:
    """
    Phase 8: Validates holder-organization relationship and creates mapping.
    
    This service implements the exact algorithm required:
    - Check holder role and KYC verification
    - Check organization approval and trust
    - Check organization connection health
    - Call organization's holder resolve API
    - Verify holder exists and is active
    - Store mapping for Phase 9 reuse
    """

    @staticmethod
    def validate_holder_for_organization(holder: CustomUser, organization: Organization) -> HolderOrgMapping:
        """
        Main entry point: Validate holder exists at organization.
        
        Args:
            holder: CustomUser with role="holder"
            organization: Organization instance
            
        Returns:
            HolderOrgMapping: Created/updated mapping
            
        Raises:
            HolderValidationException: If validation fails (and subclasses)
        """
        
        # Step 1: Verify holder role and KYC verification
        HolderValidationService._verify_holder_role(holder)
        HolderValidationService._verify_holder_kcy(holder)
        
        # Step 2: Verify organization is approved and trusted
        HolderValidationService._verify_organization_approved(organization)
        HolderValidationService._verify_organization_trusted(organization)
        
        # Step 3: Verify organization connection is healthy
        HolderValidationService._verify_organization_connection(organization)
        
        # Step 4-5: Call resolve API and verify holder exists + active
        org_response = HolderValidationService._call_holder_resolve_api(
            organization,
            holder.national_id_verified  # This attribute comes from Phase 3 KYC
        )
        
        # Extract internal_id from response
        internal_id = org_response.get("internal_id")
        if not internal_id:
            raise HolderValidationException("Organization API response missing internal_id")
        
        # Step 6: Store mapping for Phase 9
        mapping, created = HolderOrgMapping.objects.update_or_create(
            holder=holder,
            organization=organization,
            defaults={
                "internal_id": internal_id,
                "is_active": True,
                "validated_at": timezone.now(),
                "holder_national_id": getattr(holder, "national_id_verified", ""),
                "validation_error": None,
            }
        )
        
        logger.info(
            f"Holder {holder.email} validated at {organization.name} "
            f"(internal_id: {internal_id}, mapping: {'created' if created else 'updated'})"
        )
        
        return mapping

    @staticmethod
    def _verify_holder_role(holder: CustomUser):
        """Verify user has holder role."""
        if holder.role != "holder":
            raise HolderValidationException(
                f"Only holders can validate. User has role '{holder.role}'"
            )

    @staticmethod
    def _verify_holder_kcy(holder: CustomUser):
        """Verify holder has verified KYC (national ID verification)."""
        if not holder.national_id_verified:
            raise HolderNotVerifiedException(
                "Holder does not have verified national ID. "
                "Please complete Phase 3 KYC verification first."
            )

    @staticmethod
    def _verify_organization_approved(organization: Organization):
        """Verify organization is approved (Phase 5)."""
        if organization.status != "approved":
            raise OrganizationNotTrustedException(
                f"Organization {organization.name} is not approved (status: {organization.status})"
            )

    @staticmethod
    def _verify_organization_trusted(organization: Organization):
        """Verify organization is currently trusted (Phase 6)."""
        try:
            if not TrustService.is_trusted(organization):
                raise OrganizationNotTrustedException(
                    f"Organization {organization.name} is not currently trusted"
                )
        except NotAccreditedException as e:
            raise OrganizationNotTrustedException(f"Organization trust check failed: {str(e)}")

    @staticmethod
    def _verify_organization_connection(organization: Organization):
        """Verify organization's connection is healthy (Phase 7)."""
        if not hasattr(organization, 'integration_config') or not organization.integration_config:
            raise OrganizationConnectionFailedException(
                f"Organization {organization.name} has no integration config"
            )
        
        config = organization.integration_config
        
        # Check connection health
        if config.connection_health in ["unreachable", "unknown"]:
            raise OrganizationConnectionFailedException(
                f"Organization {organization.name} connection is {config.connection_health}. "
                f"Please run a health check in Phase 7 first."
            )

    @staticmethod
    def _call_holder_resolve_api(organization: Organization, national_id: str) -> dict:
        """
        Call organization's holder resolve API.
        
        Expected endpoint: GET /api/holders/resolve/{national_id}
        Expected response: {"internal_id": "...", "is_active": true, ...}
        
        Args:
            organization: Organization with configured API
            national_id: Holder's verified national ID
            
        Returns:
            dict: Parsed API response
            
        Raises:
            HolderNotFoundAtOrgException: 404 response
            HolderInactiveException: Holder found but inactive
            OrganizationConnectionFailedException: Connection error
        """
        
        if not organization.base_api_url:
            raise OrganizationConnectionFailedException(
                f"Organization {organization.name} has no base_api_url configured"
            )
        
        if not organization.api_token:
            raise OrganizationConnectionFailedException(
                f"Organization {organization.name} has no api_token configured"
            )
        
        url = f"{organization.base_api_url.rstrip('/')}/api/holders/resolve/{national_id}"
        headers = {
            "Authorization": f"Bearer {organization.api_token}",
            "Accept": "application/json"
        }
        
        try:
            timeout = getattr(settings, 'INTEGRATION_REQUEST_TIMEOUT', 10)
            with httpx.Client(timeout=timeout) as client:
                response = client.get(url, headers=headers)
            
            if response.status_code == 404:
                raise HolderNotFoundAtOrgException(
                    f"Holder with national_id {national_id} not found at {organization.name}"
                )
            
            response.raise_for_status()
            
            data = response.json()
            
            # Verify holder is active
            if not data.get("is_active", False):
                raise HolderInactiveException(
                    f"Holder is not active at {organization.name}"
                )
            
            return data
            
        except httpx.TimeoutException:
            raise OrganizationConnectionFailedException(
                f"Timeout calling {organization.name} holder resolve API"
            )
        except httpx.ConnectError as e:
            raise OrganizationConnectionFailedException(
                f"Connection error calling {organization.name}: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise OrganizationConnectionFailedException(
                    f"Invalid API token for {organization.name}"
                )
            elif e.response.status_code == 404:
                raise HolderNotFoundAtOrgException(
                    f"Holder not found at {organization.name}"
                )
            else:
                raise OrganizationConnectionFailedException(
                    f"Organization API error: {e.response.status_code}"
                )

    @staticmethod
    def invalidate_mapping(holder: CustomUser, organization: Organization):
        """
        Invalidate a holder-organization mapping (e.g., when org becomes untrusted).
        
        Args:
            holder: Holder account
            organization: Organization
        """
        try:
            mapping = HolderOrgMapping.objects.get(holder=holder, organization=organization)
            mapping.is_active = False
            mapping.validation_error = "Organization became untrusted"
            mapping.save(update_fields=["is_active", "validation_error"])
            logger.info(f"Invalidated mapping for {holder.email} at {organization.name}")
        except HolderOrgMapping.DoesNotExist:
            pass

    @staticmethod
    def get_or_validate_mapping(holder: CustomUser, organization: Organization) -> HolderOrgMapping:
        """
        Get existing mapping or validate if missing/inactive.
        
        Args:
            holder: Holder account
            organization: Organization
            
        Returns:
            HolderOrgMapping: Active mapping
            
        Raises:
            HolderValidationException: If validation fails
        """
        try:
            mapping = HolderOrgMapping.objects.get(
                holder=holder,
                organization=organization,
                is_active=True
            )
            return mapping
        except HolderOrgMapping.DoesNotExist:
            # No active mapping, need to validate
            return HolderValidationService.validate_holder_for_organization(holder, organization)
