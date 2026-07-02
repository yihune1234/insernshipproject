"""
Phase 8: Holder-to-Organization Mapping Model

Stores the validated mapping between a holder account and their internal ID
at a specific organization. Used by Phase 9 to avoid re-validating every sync.
"""

from django.conf import settings
from django.db import models

from common.models import BaseModel


class HolderOrgMapping(BaseModel):
    """
    Maps a holder to their internal ID at an organization.
    
    Created during Phase 8 holder validation. Used by Phase 9 to fetch credentials
    without re-validating the holder every time.
    
    If the organization later becomes untrusted, the mapping remains for audit purposes
    but Phase 9 should check organization trust before using it.
    """
    
    holder = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="org_mappings",
        help_text="The holder account (role must be 'holder')"
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="holder_mappings",
        help_text="The organization this mapping is for"
    )
    
    # The holder's internal ID at the organization
    internal_id = models.CharField(
        max_length=255,
        help_text="Organization's internal ID for this holder"
    )
    
    # Validation status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this mapping is currently valid"
    )
    
    # Track when validation occurred
    validated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this holder was last validated at the organization"
    )
    
    # If validation failed, why
    validation_error = models.TextField(
        blank=True,
        null=True,
        help_text="Last validation error (if any)"
    )
    
    # Holder's national ID at time of validation (for audit)
    holder_national_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Holder's national ID used in validation"
    )

    class Meta:
        db_table = "holder_holder_org_mapping"
        unique_together = [["holder", "organization"]]
        indexes = [
            models.Index(fields=["holder", "organization"]),
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self):
        return f"{self.holder.email} → {self.organization.name} ({self.internal_id})"
