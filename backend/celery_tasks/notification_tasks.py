import logging

from config.celery_app import app

logger = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_notification_email_task(self, notification_id: str):
    try:
        from apps.notifications.models import Notification
        from apps.notifications.services import EmailService
        notification = Notification.objects.select_related("recipient").get(id=notification_id)
        EmailService.send_email(
            to_address=notification.recipient.email,
            subject=notification.title,
            template_name="notification",
            context={
                "name": notification.recipient.name,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.notification_type,
            },
        )
    except Exception as exc:
        logger.error("Failed to send notification email %s: %s", notification_id, exc)
        raise self.retry(exc=exc)


@app.task
def send_bulk_notification_task(user_ids: list, title: str, message: str, notification_type: str):
    from apps.accounts.models import CustomUser
    from apps.notifications.services import NotificationService
    users = CustomUser.objects.filter(id__in=user_ids, is_active=True)
    for user in users:
        NotificationService.send(user, title, message, notification_type)
