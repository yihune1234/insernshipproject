from django.conf import settings
from django.db import models
import secrets

from common.models import BaseModel


class Organization(BaseModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("suspended", "Suspended"),
        ("revoked", "Revoked"),
    ]

    name = models.CharField(max_length=255)
    org_type = models.ForeignKey("organizations.OrganizationType", on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    seal = models.ImageField(upload_to="org_seals/", blank=True, null=True)
    brand_color = models.CharField(max_length=20, blank=True, null=True)
    
    # Integration fields (Phase 5 - Phase 7/9 will use these)
    base_api_url = models.URLField(blank=True, null=True, help_text="Root URL for organization's API endpoints")
    api_token = models.TextField(blank=True, null=True, help_text="Encrypted Bearer token for calling org API")
    api_token_encrypted = models.BooleanField(default=False, help_text="Whether api_token is encrypted")
    
    # Public key for signature verification (Phase 5, used in Phase 12)
    public_key = models.TextField(blank=True, null=True, help_text="PEM-formatted RSA public key for signature verification")
    public_key_verified_at = models.DateTimeField(null=True, blank=True, help_text="When public key was last validated")
    
    # Webhook fields (platform-generated, never org-submitted)
    platform_webhook_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Platform-generated webhook URL for org to POST revocation events to"
    )
    platform_webhook_secret = models.TextField(
        blank=True,
        null=True,
        help_text="Platform-generated webhook secret (encrypted/hashed, shown once)"
    )
    platform_webhook_secret_encrypted = models.BooleanField(default=False)
    
    # DID for verifying organization identity
    did = models.ForeignKey(
        "did.DIDDocument", on_delete=models.SET_NULL, null=True, blank=True
    )
    
    # Approval tracking
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_organizations",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organizations_organization"

    def __str__(self):
        return self.name
