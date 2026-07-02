import logging

from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    @classmethod
    def log(cls, action: str, entity_type: str, entity_id: str, actor=None, metadata: dict = None, request=None):
        try:
            ip = None
            user_agent = None
            if request:
                ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR"))
                user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
            AuditLog.objects.create(
                actor=actor,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                metadata=metadata or {},
                ip_address=ip,
                user_agent=user_agent,
            )
        except Exception as e:
            logger.error("AuditService.log failed: %s", e)
