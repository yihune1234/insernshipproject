from django.db import models


class PushToken(models.Model):
    PLATFORM_CHOICES = [
        ("expo", "Expo Push"),
        ("fcm", "Firebase Cloud Messaging"),
        ("apns", "Apple Push Notification Service"),
    ]

    user = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, related_name="push_tokens"
    )
    token = models.TextField(unique=True)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, default="expo")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_pushtoken"
        verbose_name = "Push Token"
        verbose_name_plural = "Push Tokens"

    def __str__(self):
        return f"{self.platform}:{self.token[:20]}..."
