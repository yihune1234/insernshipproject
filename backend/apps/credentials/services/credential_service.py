import logging

from django.utils.dateparse import parse_datetime
from django.utils import timezone

from apps.audit.services.audit_service import AuditService
from apps.credentials.exceptions import InvalidStatusTransitionException
from apps.credentials.models import Credential
from apps.national_id.models import NationalIDVerification

logger = logging.getLogger(__name__)

VALID_TRANSITIONS = {
    "pending_match": ["active", "revoked", "suspended", "expired"],
    "active": ["revoked", "suspended", "expired"],
    "suspended": ["active", "revoked"],
    "expired": ["active"],
    "revoked": [],
}


class CredentialService:
    @classmethod
    def save(cls, organization, data: dict) -> Credential:
        holder = None
        status = "pending_match"
        national_id = data.get("national_id", "")
        try:
            nid = NationalIDVerification.objects.select_related("user").get(
                fin=national_id, verified=True
            )
            holder = nid.user
            status = "active"
        except NationalIDVerification.DoesNotExist:
            pass

        issued_at = data.get("issued_at")
        if isinstance(issued_at, str):
            issued_at = parse_datetime(issued_at) or timezone.now()

        credential = Credential.objects.create(
            credential_id=data["credential_id"],
            organization=organization,
            national_id=national_id,
            holder=holder,
            credential_type=data.get("credential_type", ""),
            title=data.get("title", ""),
            data=data.get("data", {}),
            issued_at=issued_at or timezone.now(),
            expires_at=data.get("expires_at"),
            status=status,
            signature=data.get("signature"),
            signature_algorithm=data.get("signature_algorithm"),
            raw_payload=data.get("raw_payload"),
            last_synced_at=timezone.now(),
            sync_source="organization_api",
        )
        try:
            AuditService.log(
                action="credential.saved",
                entity_type="Credential",
                entity_id=str(credential.id),
                metadata={"credential_id": credential.credential_id, "org": str(organization.id)},
            )
        except Exception:
            logger.warning("Failed to log credential.saved audit entry")
        return credential

    @classmethod
    def update(cls, credential: Credential, data: dict) -> Credential:
        credential.data = data.get("data", credential.data)
        credential.title = data.get("title", credential.title)
        credential.last_synced_at = timezone.now()
        if data.get("expires_at"):
            credential.expires_at = data["expires_at"]
        if credential.status != "revoked":
            credential.save()
        try:
            AuditService.log(
                action="credential.updated",
                entity_type="Credential",
                entity_id=str(credential.id),
            )
        except Exception:
            logger.warning("Failed to log credential.updated audit entry")
        return credential

    @classmethod
    def update_status(cls, credential: Credential, new_status: str, reason: str = None) -> Credential:
        allowed = VALID_TRANSITIONS.get(credential.status, [])
        if new_status not in allowed:
            raise InvalidStatusTransitionException(
                f"Cannot transition from {credential.status} to {new_status}"
            )
        credential.status = new_status
        if new_status == "revoked":
            credential.revoked_at = timezone.now()
            credential.revocation_reason = reason
        credential.save()
        try:
            AuditService.log(
                action=f"credential.status.{new_status}",
                entity_type="Credential",
                entity_id=str(credential.id),
                metadata={"reason": reason},
            )
        except Exception:
            logger.warning("Failed to log credential.status.%s audit entry", new_status)
        return credential

    @classmethod
    def match_pending(cls, user, national_id: str) -> int:
        credentials = Credential.objects.filter(national_id=national_id, status="pending_match")
        count = credentials.count()
        credentials.update(holder=user, status="active")
        try:
            AuditService.log(
                action="credential.matched",
                entity_type="CustomUser",
                entity_id=str(user.id),
                metadata={"matched_count": count, "national_id": national_id},
            )
        except Exception:
            logger.warning("Failed to log credential.matched audit entry")
        return count

    @classmethod
    def get_for_holder(cls, user, status=None, updated_since=None):
        qs = Credential.objects.filter(holder=user)
        if status:
            qs = qs.filter(status=status)
        if updated_since:
            qs = qs.filter(updated_at__gte=updated_since)
        return qs.order_by("-updated_at")
