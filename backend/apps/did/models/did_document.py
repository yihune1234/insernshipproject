from django.conf import settings
from django.db import models

from common.models import BaseModel


class DIDDocument(BaseModel):
    STATUS_CHOICES = [("active", "Active"), ("deactivated", "Deactivated")]

    did = models.CharField(max_length=500, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="did_documents",
    )
    document = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        db_table = "did_document"
