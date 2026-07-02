from django.db import models

from common.models import BaseModel


class CredentialOrganization(BaseModel):
    SYNC_STATUS_CHOICES = [
        ("idle", "Idle"),
        ("syncing", "Syncing"),
        ("error", "Error"),
    ]

    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="credential_org",
    )
    credential_count = models.IntegerField(default=0)
    last_credential_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default="idle")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "credentials_organization"
