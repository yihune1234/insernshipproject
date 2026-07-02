from django.conf import settings
from django.db import models

from common.models import BaseModel


class CredentialShare(BaseModel):
    credential = models.ForeignKey(
        "credentials.Credential", on_delete=models.CASCADE, related_name="shares"
    )
    holder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="credential_shares"
    )
    token = models.CharField(max_length=128, unique=True)
    disclosed_claims = models.JSONField(default=list)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    access_count = models.IntegerField(default=0)

    class Meta:
        db_table = "holder_credential_share"
