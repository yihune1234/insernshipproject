from django.conf import settings
from django.db import models

from common.models import BaseModel


class VerificationResult(BaseModel):
    credential = models.ForeignKey(
        "credentials.Credential",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_results",
    )
    external_credential_id = models.CharField(max_length=255)
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_results",
    )
    is_valid = models.BooleanField()
    checks = models.JSONField(default=list)
    overall_message = models.CharField(max_length=500, blank=True)
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "verification_result"
