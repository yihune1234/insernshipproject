from django.db import models

from common.models import BaseModel


class DIDKey(BaseModel):
    PURPOSE_CHOICES = [
        ("authentication", "Authentication"),
        ("assertionMethod", "Assertion Method"),
    ]

    did_document = models.ForeignKey(
        "did.DIDDocument", on_delete=models.CASCADE, related_name="keys"
    )
    public_key_hex = models.CharField(max_length=500)
    encrypted_private_key = models.TextField()
    key_type = models.CharField(max_length=50, default="Ed25519")
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "did_key"
