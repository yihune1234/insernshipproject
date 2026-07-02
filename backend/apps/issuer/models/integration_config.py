from django.db import models

from common.models import BaseModel


class IntegrationConfig(BaseModel):
    AUTH_TYPE_CHOICES = [
        ("api_key", "API Key"),
        ("bearer_token", "Bearer Token"),
        ("basic_auth", "Basic Authentication"),
        ("oauth2", "OAuth 2.0"),
        ("custom_header", "Custom Header"),
    ]

    SYNC_STATUS_CHOICES = [
        ("idle", "Idle"),
        ("syncing", "Syncing"),
        ("error", "Error"),
        ("success", "Success"),
    ]

    HEALTH_CHOICES = [
        ("healthy", "Healthy"),
        ("degraded", "Degraded"),
        ("unreachable", "Unreachable"),
        ("unknown", "Unknown"),
    ]

    INTEGRATION_STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("revoked", "Revoked"),
        ("pending_setup", "Pending Setup"),
    ]

    API_PROTOCOL_CHOICES = [
        ("rest", "REST API"),
        ("graphql", "GraphQL"),
        ("soap", "SOAP"),
    ]

    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="integration_config",
    )

    # API configuration
    auth_type = models.CharField(max_length=20, choices=AUTH_TYPE_CHOICES, default="bearer_token")
    api_key = models.TextField(blank=True, null=True, help_text="API key or token value")
    api_key_header_name = models.CharField(max_length=100, blank=True, null=True, default="Authorization",
        help_text="Header name for the API key")
    auth_config = models.JSONField(default=dict, blank=True,
        help_text="Additional auth config (OAuth2 fields, etc.)")
    base_url = models.URLField(blank=True, null=True,
        help_text="Root URL for the external system API")
    api_version = models.CharField(max_length=50, blank=True, null=True)
    api_protocol = models.CharField(max_length=20, choices=API_PROTOCOL_CHOICES, default="rest")
    custom_headers = models.JSONField(default=dict, blank=True,
        help_text="Custom HTTP headers for API requests")
    timeout_seconds = models.IntegerField(default=30)
    rate_limit_per_minute = models.IntegerField(default=60, null=True, blank=True)

    # Sync configuration
    sync_enabled = models.BooleanField(default=True)
    sync_interval_minutes = models.IntegerField(default=60)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    next_sync_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default="idle")
    consecutive_failures = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    retry_backoff_minutes = models.IntegerField(default=5,
        help_text="Base minutes for exponential backoff")

    # Integration status
    integration_status = models.CharField(max_length=20, choices=INTEGRATION_STATUS_CHOICES, default="pending_setup")
    paused_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.TextField(blank=True, null=True)
    revocation_reason = models.TextField(blank=True, null=True)

    # Webhook configuration
    webhook_url = models.URLField(blank=True, null=True)
    webhook_secret = models.TextField(blank=True, null=True)
    webhook_enabled = models.BooleanField(default=False)
    webhook_events = models.JSONField(default=list, blank=True,
        help_text="List of event types to receive via webhook")

    # Connection health monitoring
    connection_health = models.CharField(max_length=20, choices=HEALTH_CHOICES, default="unknown")
    last_health_check_at = models.DateTimeField(null=True, blank=True)
    last_error_message = models.TextField(blank=True, null=True)

    # Setup tracking
    setup_completed_at = models.DateTimeField(null=True, blank=True)
    setup_step = models.IntegerField(default=0,
        help_text="Current step in the multi-step setup wizard (0 = not started)")

    class Meta:
        db_table = "issuer_integration_config"

    def __str__(self):
        return f"IntegrationConfig({self.organization.name})"
