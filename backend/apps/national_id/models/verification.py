import uuid

from django.conf import settings
from django.db import models

from common.models import BaseModel


class NationalIDVerification(BaseModel):
    """
    Tracks National ID verification sessions.
    
    The user field is nullable because verification can be initiated
    before a user account is created (during registration).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="national_id_verification",
        null=True,
        blank=True,
    )
    fin = models.CharField(max_length=50)
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    session_id = models.UUIDField(default=uuid.uuid4)

    class Meta:
        db_table = "national_id_verification"
