from django.conf import settings
from django.db import models

from common.models import BaseModel


class VerificationHistory(BaseModel):
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_history",
    )
    credential_id = models.CharField(max_length=255)
    organization_name = models.CharField(max_length=255, blank=True)
    credential_type = models.CharField(max_length=100, blank=True)
    result = models.BooleanField()
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "verification_history"
        ordering = ["-verified_at"]
