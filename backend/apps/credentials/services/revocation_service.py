"""
Phase 11: Credential Revocation Service

Handles credential revocation via:
1. Webhook from organization (Phase 14)
2. Integration service detecting revoked status during sync (Phase 9)
3. Automatic expiration detection
"""

import logging

from django.db.models import Q
from django.utils import timezone

from apps.audit.services.audit_service import AuditService
from apps.credentials.models import Credential

logger = logging.getLogger(__name__)


class RevocationService:
    """
    Phase 11: Handle credential revocation events.
    
    Credentials can be revoked by:
    - Organization webhook (immediate notification)
    - Phase 9 sync (discovered during sync)
    - Automatic expiration (scheduled check)
    """
    
    @classmethod
    def revoke_credential(cls, credential: Credential, reason: str = None, source: str = "manual") -> Credential:
        """
        Revoke a credential immediately.
        
        Args:
            credential: Credential instance
            reason: Revocation reason
            source: Source of revocation ("webhook", "sync", "expiration", "manual")
            
        Returns:
            Credential: Updated credential instance
        """
        if credential.status == "revoked":
            logger.debug(f"Credential {credential.credential_id} already revoked")
            return credential
        
        # Valid transitions to revoked: from any status
        credential.status = "revoked"
        credential.revoked_at = timezone.now()
        credential.revocation_reason = reason or f"Revoked via {source}"
        credential.save()
        
        logger.info(
            f"Credential {credential.credential_id} revoked. "
            f"Reason: {credential.revocation_reason}"
        )
        
        try:
            AuditService.log(
                action="credential.revoked",
                entity_type="Credential",
                entity_id=str(credential.id),
                metadata={
                    "reason": credential.revocation_reason,
                    "source": source,
                },
            )
        except Exception:
            logger.warning("Failed to log revocation")
        
        return credential
    
    @classmethod
    def revoke_by_webhook(cls, credential_id: str, reason: str = None) -> Credential:
        """
        Revoke credential via organization webhook notification.
        
        Called by Phase 14 webhook handler when organization notifies of revocation.
        
        Args:
            credential_id: Organization's credential ID
            reason: Optional revocation reason from organization
            
        Returns:
            Credential: Updated credential instance
            
        Raises:
            Credential.DoesNotExist: If credential not found
        """
        credential = Credential.objects.get(credential_id=credential_id)
        return cls.revoke_credential(credential, reason=reason, source="webhook")
    
    @classmethod
    def handle_expiration(cls, credential: Credential) -> Credential:
        """
        Mark credential as expired if expiration_date has passed.
        
        Called by scheduled task or on-access evaluation.
        
        Args:
            credential: Credential instance
            
        Returns:
            Credential: Updated credential instance (may not be changed if not expired)
        """
        if credential.status == "expired":
            return credential
        
        if credential.expires_at is None:
            # No expiration date, never expires
            return credential
        
        if credential.expires_at < timezone.now():
            credential.status = "expired"
            credential.save()
            
            logger.info(
                f"Credential {credential.credential_id} marked as expired. "
                f"Expired at: {credential.expires_at}"
            )
            
            try:
                AuditService.log(
                    action="credential.expired",
                    entity_type="Credential",
                    entity_id=str(credential.id),
                    metadata={"expired_at": credential.expires_at.isoformat()},
                )
            except Exception:
                pass
        
        return credential
    
    @classmethod
    def check_and_mark_expired(cls) -> dict:
        """
        Scheduled task: Check all active credentials and mark as expired if past expiration_date.
        
        Returns:
            dict: Summary of checked and expired credentials
        """
        
        # Get all active credentials with expiration dates in the past
        now = timezone.now()
        expired_qs = Credential.objects.filter(
            Q(status="active") | Q(status="pending_match"),
            expires_at__lt=now
        )
        
        count = 0
        for credential in expired_qs:
            cls.handle_expiration(credential)
            count += 1
        
        if count > 0:
            logger.info(f"Marked {count} credentials as expired")
        
        return {
            "checked": count,
            "expired": count,
        }
    
    @classmethod
    def get_revoked_count(cls, organization=None) -> int:
        """
        Get count of revoked credentials (optionally filtered by organization).
        
        Args:
            organization: Optional organization FK
            
        Returns:
            int: Count of revoked credentials
        """
        qs = Credential.objects.filter(status="revoked")
        if organization:
            qs = qs.filter(organization=organization)
        return qs.count()
    
    @classmethod
    def get_expired_count(cls, organization=None) -> int:
        """
        Get count of expired credentials (optionally filtered by organization).
        
        Args:
            organization: Optional organization FK
            
        Returns:
            int: Count of expired credentials
        """
        qs = Credential.objects.filter(status="expired")
        if organization:
            qs = qs.filter(organization=organization)
        return qs.count()
    
    @classmethod
    def get_revocation_status(cls, credential: Credential) -> dict:
        """
        Get detailed revocation status for a credential.
        
        Args:
            credential: Credential instance
            
        Returns:
            dict: Status information
        """
        if credential.status == "revoked":
            return {
                "revoked": True,
                "revoked_at": credential.revoked_at.isoformat() if credential.revoked_at else None,
                "reason": credential.revocation_reason,
            }
        
        if credential.status == "expired":
            return {
                "expired": True,
                "expired_at": credential.expires_at.isoformat() if credential.expires_at else None,
            }
        
        return {
            "revoked": False,
            "expired": False,
        }
