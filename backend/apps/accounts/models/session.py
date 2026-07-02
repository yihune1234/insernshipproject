from django.conf import settings
from django.db import models

from common.models import BaseModel


class UserSession(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions"
    )
    refresh_token_hash = models.CharField(max_length=255)
    device_info = models.CharField(max_length=500, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "accounts_usersession"
