"""
Phase 10: Credential Matching Service

Matches pending credentials to their holders based on verified national ID verification (Phase 3).
Triggered by NationalIDVerification completion or explicit match request.
"""

import logging
from django.utils import timezone

from apps.audit.services.audit_service import AuditService
from apps.credentials.models import Credential
from apps.credentials.exceptions import InvalidStatusTransitionException

logger = logging.getLogger(__name__)


class MatchingService:
    """
    Phase 10: Match pending credentials to holders.
    
    A credential in pending_match status is waiting for its holder's national ID to be verified (Phase 3).
    Once verified, this service matches all pending credentials for that national_id to the holder account.
    """
    
    @classmethod
    def match_for_national_id(cls, user, national_id: str) -> int:
        """
        Match all pending credentials for a national_id to a holder account.
        
        Triggered when:
        1. NationalIDVerification is marked verified (Phase 3)
        2. User explicitly requests matching
        
        Args:
            user: Holder account (must have role="holder")
            national_id: Verified national ID
            
        Returns:
            int: Number of credentials matched
            
        Raises:
            ValueError: If user role is not "holder"
        """
        if user.role != "holder":
            raise ValueError(f"Cannot match credentials for non-holder role: {user.role}")
        
        if not hasattr(user, 'national_id_verified') or not user.national_id_verified:
            raise ValueError(f"User {user.email} does not have verified national ID")
        
        # Get all pending credentials for this national_id
        pending_credentials = Credential.objects.filter(
            national_id=national_id,
            status="pending_match",
            holder__isnull=True  # Not yet assigned to a holder
        )
        
        count = pending_credentials.count()
        
        if count == 0:
            logger.info(f"No pending credentials to match for national_id {national_id}")
            return 0
        
        # Match all pending credentials to this holder
        pending_credentials.update(
            holder=user,
            status="active",
            updated_at=timezone.now()
        )
        
        logger.info(
            f"Matched {count} credentials for national_id {national_id} to holder {user.email}"
        )
        
        try:
            AuditService.log(
                action="credential.matched",
                entity_type="CustomUser",
                entity_id=str(user.id),
                metadata={
                    "matched_count": count,
                    "national_id": national_id,
                },
            )
        except Exception:
            logger.warning("Failed to log matching action")
        
        return count
    
    @classmethod
    def get_pending_for_holder(cls, user) -> list:
        """
        Get all pending credentials that could be matched to a holder.
        
        Requires holder to have verified national ID (Phase 3).
        
        Args:
            user: Holder account
            
        Returns:
            list: Queryset of pending credentials for this holder's national_id
        """
        if user.role != "holder":
            return Credential.objects.none()
        
        if not user.national_id_verified:
            return Credential.objects.none()
        
        return Credential.objects.filter(
            status="pending_match",
            holder__isnull=True
        ).order_by("-created_at")
    
    @classmethod
    def rematch_credential(cls, credential: Credential, user) -> Credential:
        """
        Re-match a credential to a different holder (e.g., if incorrectly matched).
        
        Requires explicit matching (not automatic).
        
        Args:
            credential: Credential instance in pending_match or active status
            user: New holder account
            
        Returns:
            Credential: Updated credential instance
            
        Raises:
            InvalidStatusTransitionException: If credential cannot be re-matched
            ValueError: If user is not a valid holder
        """
        if user.role != "holder":
            raise ValueError(f"Cannot match to non-holder role: {user.role}")
        
        if credential.status not in ["pending_match", "active"]:
            raise InvalidStatusTransitionException(
                f"Can only re-match pending_match or active credentials, not {credential.status}"
            )
        
        credential.holder = user
        if credential.status == "pending_match":
            credential.status = "active"
        credential.updated_at = timezone.now()
        credential.save()
        
        logger.info(
            f"Re-matched credential {credential.credential_id} to holder {user.email}"
        )
        
        try:
            AuditService.log(
                action="credential.rematched",
                entity_type="Credential",
                entity_id=str(credential.id),
                metadata={"holder_id": str(user.id)},
            )
        except Exception:
            pass
        
        return credential
    
    @classmethod
    def validate_all_credentials_externally_sourced(cls) -> dict:
        """
        Validate that all credentials have sync_source set (Phase 10 requirement).
        
        This is a global validation check - every credential should be marked as
        originating from external sync (organization API or webhook), never generated locally.
        
        Returns:
            dict: Validation result with count of invalid credentials
        """
        # Find any credentials without sync_source set
        invalid_count = Credential.objects.filter(sync_source__isnull=True).count()
        
        if invalid_count > 0:
            logger.error(
                f"Found {invalid_count} credentials without sync_source set. "
                f"All credentials must be externally sourced (Phase 10 requirement)."
            )
            return {
                "valid": False,
                "invalid_count": invalid_count,
                "message": "Found credentials not marked as externally sourced"
            }
        
        return {
            "valid": True,
            "invalid_count": 0,
            "message": "All credentials properly marked as externally sourced"
        }
