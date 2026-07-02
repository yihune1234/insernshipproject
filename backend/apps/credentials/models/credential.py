from django.conf import settings
from django.db import models

from common.models import BaseModel


class Credential(BaseModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("revoked", "Revoked"),
        ("suspended", "Suspended"),
        ("expired", "Expired"),
        ("pending_match", "Pending Match"),
    ]
    
    # Phase 10: Marker to prove all credentials originate from external sync, never locally generated
    SYNC_SOURCE_CHOICES = [
        ("organization_api", "Organization API (Phase 9 sync)"),
        ("webhook", "Organization Webhook (Phase 14 revocation)"),
    ]

    credential_id = models.CharField(max_length=255, unique=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="credentials",
    )
    national_id = models.CharField(max_length=255)
    holder = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="credentials",
    )
    credential_type = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    data = models.JSONField(default=dict)
    issued_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending_match")
    signature = models.TextField(blank=True, null=True)
    signature_algorithm = models.CharField(max_length=50, blank=True, null=True)
    raw_payload = models.TextField(blank=True, null=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revocation_reason = models.TextField(blank=True, null=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    
    # Phase 10: Proof that credential originated from external sync, never locally generated
    sync_source = models.CharField(
        max_length=20,
        choices=SYNC_SOURCE_CHOICES,
        default="organization_api",
        help_text="Source of credential (Phase 10 requirement: must always be externally sourced)"
    )

    class Meta:
        db_table = "credentials_credential"
        indexes = [
            models.Index(fields=["holder", "status"]),
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["credential_id"]),
            models.Index(fields=["national_id", "organization"]),
            models.Index(fields=["updated_at"]),
        ]
