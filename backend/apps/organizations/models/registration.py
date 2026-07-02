from django.conf import settings
from django.db import models

from common.models import BaseModel


class OrgRegistration(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("under_review", "Under Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    email = models.EmailField()
    password_hash = models.CharField(max_length=255)
    org_name = models.CharField(max_length=255)
    org_type = models.ForeignKey(
        "organizations.OrganizationType", on_delete=models.PROTECT, null=True, blank=True
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    step = models.IntegerField(default=1)
    email_verified = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_registrations",
    )
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "organizations_registration"
