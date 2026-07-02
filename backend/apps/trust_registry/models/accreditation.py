from django.conf import settings
from django.db import models

from common.models import BaseModel


class Accreditation(BaseModel):
    """
    Accreditation record for organizations.
    
    Tracks:
    - Accreditation status (pending/approved/suspended/revoked)
    - Trust level and score
    - Validity period (start/end dates)
    - Admin approval tracking
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("suspended", "Suspended"),
        ("revoked", "Revoked"),
    ]

    organization = models.OneToOneField(
        "organizations.Organization", on_delete=models.CASCADE, related_name="accreditation"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # Trust scoring
    trust_level = models.IntegerField(default=1, help_text="Trust level 1-5")
    trust_score = models.DecimalField(
        max_digits=4,
        decimal_places=3,
        default=0,
        help_text="Trust score 0.000-1.000"
    )
    
    # Validity period (Phase 6 requirement)
    issued_at = models.DateTimeField(auto_now_add=True, help_text="When accreditation was issued")
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When accreditation expires (null = no expiry)"
    )
    
    # Admin tracking
    accredited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accreditations_granted",
    )
    
    # Notes and reason
    notes = models.TextField(blank=True, help_text="Admin notes about this accreditation")
    revocation_reason = models.TextField(
        blank=True,
        help_text="Reason for revocation or suspension (if applicable)"
    )

    class Meta:
        db_table = "trust_registry_accreditation"
