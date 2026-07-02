from django.db import models

from common.models import BaseModel


class TrustLevel(BaseModel):
    level = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    can_sync_credentials = models.BooleanField(default=True)
    can_receive_verifications = models.BooleanField(default=True)
    max_credentials_per_sync = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "trust_registry_level"
        ordering = ["level"]
