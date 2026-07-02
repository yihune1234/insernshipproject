from django.conf import settings
from django.db import models

from common.models import BaseModel


class OrganizationMember(BaseModel):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("staff", "Staff"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="org_memberships"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "organizations_member"
        unique_together = [["organization", "user"]]
