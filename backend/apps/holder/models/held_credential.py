from django.db import models

from common.models import BaseModel


class HeldCredential(BaseModel):
    wallet = models.ForeignKey(
        "holder.Wallet", on_delete=models.CASCADE, related_name="held_credentials"
    )
    credential = models.ForeignKey(
        "credentials.Credential", on_delete=models.CASCADE, related_name="held_in"
    )
    alias = models.CharField(max_length=255, blank=True, null=True)
    is_pinned = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "holder_held_credential"
        unique_together = [["wallet", "credential"]]
