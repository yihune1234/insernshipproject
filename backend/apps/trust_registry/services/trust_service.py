"""
Trust Registry Service - Phase 6 trust checking logic.

Determines if an organization is trusted based on:
1. Accreditation status (approved and not expired)
2. Public key validity (must exist and be parseable RSA key)
3. Accreditation not suspended/revoked
"""

import logging
from datetime import datetime
from django.utils import timezone

from apps.trust_registry.models import Accreditation, TrustLevel
from apps.organizations.utils.crypto import PublicKeyValidator, PublicKeyValidationError

logger = logging.getLogger(__name__)


class NotAccreditedException(Exception):
    pass


class TrustService:
    """
    Trust Registry service - single source of truth for org trustworthiness.
    
    All apps call is_trusted(org_id) to check if organization is trustworthy.
    """

    @classmethod
    def is_trusted(cls, organization) -> bool:
        """
        Check if an organization is currently trusted.
        
        Trusted means:
        - Organization is accredited with status "approved"
        - Accreditation has not expired
        - Organization has a valid, parseable RSA public key
        - Public key was recently verified
        
        Args:
            organization: Organization instance or ID
            
        Returns:
            bool: True if organization is trusted, False otherwise
        """
        try:
            cls.check_organization_trust(organization)
            return True
        except NotAccreditedException as e:
            logger.debug(f"Organization not trusted: {e}")
            return False

    @classmethod
    def check_organization_trust(cls, organization):
        """
        Check organization trust status and raise if not trusted.
        
        Args:
            organization: Organization instance
            
        Raises:
            NotAccreditedException: If organization is not trusted
        """
        # Verify accreditation exists and is approved
        try:
            acc = Accreditation.objects.get(organization=organization, status="approved")
        except Accreditation.DoesNotExist:
            raise NotAccreditedException(
                f"Organization {organization.name} is not accredited or accreditation is not approved"
            )
        
        # Check if accreditation has expired
        if acc.expires_at and acc.expires_at < timezone.now():
            raise NotAccreditedException(
                f"Organization {organization.name} accreditation expired at {acc.expires_at}"
            )
        
        # In development/simulation mode, skip public key checks so seed
        # organizations can participate in credential verification without
        # needing a real RSA key pair.
        from django.conf import settings
        simulation_mode = getattr(settings, "USE_FAYDA_SIMULATION", False) or settings.DEBUG

        if not simulation_mode:
            # Check that organization has a valid public key
            if not organization.public_key:
                raise NotAccreditedException(
                    f"Organization {organization.name} does not have a public key on file"
                )

            # Validate public key format (must be valid RSA PEM)
            try:
                PublicKeyValidator.validate_rsa_public_key(organization.public_key)
            except PublicKeyValidationError as e:
                raise NotAccreditedException(
                    f"Organization {organization.name} public key is invalid: {str(e)}"
                )

            # Check if public key was recently verified
            if organization.public_key_verified_at is None:
                raise NotAccreditedException(
                    f"Organization {organization.name} public key has never been verified"
                )
        
        # If we got here, organization is trusted
        return acc

    @classmethod
    def get_trust_level(cls, organization):
        """
        Get trust level for organization.
        
        Args:
            organization: Organization instance
            
        Returns:
            TrustLevel: Trust level definition or None if not found
        """
        acc = cls.check_organization_trust(organization)
        try:
            return TrustLevel.objects.get(level=acc.trust_level)
        except TrustLevel.DoesNotExist:
            logger.warning(
                f"No TrustLevel defined for level {acc.trust_level}"
            )
            return None

    @classmethod
    def suspend_trust_on_key_rotation(cls, organization):
        """
        Suspend trust when organization's public key is rotated.
        
        When a new public key is submitted, trust must be suspended until
        admin re-confirms the new key. Silent key swaps must not bypass checks.
        
        Args:
            organization: Organization instance with new public key
        """
        try:
            acc = Accreditation.objects.get(organization=organization)
            acc.status = "suspended"
            acc.save(update_fields=['status'])
            
            logger.warning(
                f"Trust suspended for organization {organization.name} due to key rotation. "
                f"Admin must re-confirm new key."
            )
            
        except Accreditation.DoesNotExist:
            logger.info(f"No accreditation to suspend for {organization.name}")

    @classmethod
    def reconfirm_after_key_rotation(cls, organization, reconfirmed_by) -> Accreditation:
        """
        Re-confirm organization trust after public key rotation.
        
        Admin calls this after reviewing and approving the new key.
        
        Args:
            organization: Organization with new key
            reconfirmed_by: Admin user reconfirming
            
        Returns:
            Accreditation: Updated accreditation record
        """
        try:
            acc = Accreditation.objects.get(organization=organization)
            
            # Validate new key before re-confirming
            PublicKeyValidator.validate_rsa_public_key(organization.public_key)
            
            # Re-enable trust
            acc.status = "approved"
            acc.accredited_by = reconfirmed_by
            acc.save(update_fields=['status', 'accredited_by'])
            
            # Update public_key_verified_at
            organization.public_key_verified_at = timezone.now()
            organization.save(update_fields=['public_key_verified_at'])
            
            logger.info(
                f"Trust re-confirmed for organization {organization.name} after key rotation"
            )
            
            return acc
            
        except Accreditation.DoesNotExist:
            raise NotAccreditedException(
                f"Organization {organization.name} has no accreditation to reconfirm"
            )
        except PublicKeyValidationError as e:
            raise NotAccreditedException(
                f"New public key for {organization.name} is invalid: {str(e)}"
            )
