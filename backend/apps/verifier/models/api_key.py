from django.conf import settings
from django.db import models

from common.models import BaseModel


class VerifierAPIKey(BaseModel):
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys"
    )
    name = models.CharField(max_length=255)
    key_hash = models.CharField(max_length=64)
    prefix = models.CharField(max_length=8)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "verifier_api_key"
