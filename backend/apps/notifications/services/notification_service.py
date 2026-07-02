import logging

from apps.notifications.models import Notification, NotificationPreference

logger = logging.getLogger(__name__)


class NotificationService:
    @classmethod
    def send(cls, recipient, title: str, message: str, notification_type: str):
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        try:
            prefs, _ = NotificationPreference.objects.get_or_create(user=recipient)
            if prefs.email_notifications:
                from celery_tasks.notification_tasks import send_notification_email_task
                send_notification_email_task.delay(str(notification.id))
        except Exception as e:
            logger.error("Failed to queue notification email: %s", e)
        return notification

    @classmethod
    def notify_credential_received(cls, user, credential):
        cls.send(
            recipient=user,
            title="New Credential Received",
            message=f"You received a new credential: {credential.title}",
            notification_type="credential_received",
        )

    @classmethod
    def notify_credential_revoked(cls, user, credential, reason: str = ""):
        cls.send(
            recipient=user,
            title="Credential Revoked",
            message=f"Your credential '{credential.title}' has been revoked. {reason}",
            notification_type="credential_revoked",
        )

    @classmethod
    def notify_sync_complete(cls, user, sync_result):
        cls.send(
            recipient=user,
            title="Sync Complete",
            message=f"Sync complete. {sync_result.get('created', 0)} new, {sync_result.get('updated', 0)} updated.",
            notification_type="sync_complete",
        )
