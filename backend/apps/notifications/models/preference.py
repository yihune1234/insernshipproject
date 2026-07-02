from django.conf import settings
from django.db import models

from common.models import BaseModel


class NotificationPreference(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    credential_received = models.BooleanField(default=True)
    credential_updated = models.BooleanField(default=True)
    credential_revoked = models.BooleanField(default=True)
    verification_complete = models.BooleanField(default=True)
    sync_complete = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)

    class Meta:
        db_table = "notifications_preference"
