from django.conf import settings
from django.db import models

from common.models import BaseModel


class Notification(BaseModel):
    TYPE_CHOICES = [
        ("credential_received", "Credential Received"),
        ("credential_updated", "Credential Updated"),
        ("credential_revoked", "Credential Revoked"),
        ("verification_complete", "Verification Complete"),
        ("sync_complete", "Sync Complete"),
        ("system", "System"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
