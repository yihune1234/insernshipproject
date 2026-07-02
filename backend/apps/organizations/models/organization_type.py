from django.db import models

from common.models import BaseModel


class OrganizationType(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "organizations_type"

    def __str__(self):
        return self.name
