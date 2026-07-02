from django.conf import settings
from django.db import models

from common.models import BaseModel


class Wallet(BaseModel):
    holder = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet"
    )
    name = models.CharField(max_length=255, default="My Wallet")

    class Meta:
        db_table = "holder_wallet"
