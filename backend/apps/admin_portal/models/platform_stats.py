from django.db import models

from common.models import BaseModel


class PlatformStats(BaseModel):
    stat_date = models.DateField(unique=True)
    total_users = models.IntegerField(default=0)
    total_organizations = models.IntegerField(default=0)
    total_credentials = models.IntegerField(default=0)
    active_credentials = models.IntegerField(default=0)
    total_verifications = models.IntegerField(default=0)
    successful_verifications = models.IntegerField(default=0)
    new_credentials_today = models.IntegerField(default=0)
    sync_errors_today = models.IntegerField(default=0)

    class Meta:
        db_table = "admin_portal_stats"
        ordering = ["-stat_date"]
