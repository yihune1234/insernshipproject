from django.db import models

from common.models import BaseModel


class SyncLog(BaseModel):
    SYNC_TYPE_CHOICES = [("manual", "Manual"), ("scheduled", "Scheduled"), ("webhook", "Webhook")]
    STATUS_CHOICES = [("started", "Started"), ("completed", "Completed"), ("failed", "Failed")]

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="sync_logs"
    )
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="started")
    credentials_processed = models.IntegerField(default=0)
    credentials_created = models.IntegerField(default=0)
    credentials_updated = models.IntegerField(default=0)
    credentials_failed = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "credentials_sync_log"
