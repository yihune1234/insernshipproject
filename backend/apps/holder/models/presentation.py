from django.conf import settings
from django.db import models

from common.models import BaseModel


class Presentation(BaseModel):
    holder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presentations"
    )
    credentials = models.JSONField(default=list)
    signed_data = models.TextField(blank=True, null=True)
    qr_code_url = models.TextField(blank=True, null=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "holder_presentation"
