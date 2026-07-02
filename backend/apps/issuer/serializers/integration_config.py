from rest_framework import serializers

from apps.issuer.models import IntegrationConfig


class FieldMappingSerializer(serializers.Serializer):
    external_field = serializers.CharField(max_length=255)
    external_data_type = serializers.ChoiceField(
        choices=[("string", "String"), ("number", "Number"), ("boolean", "Boolean"),
                 ("date", "Date"), ("datetime", "DateTime"), ("json", "JSON Object"), ("array", "Array")],
        default="string"
    )
    external_field_path = serializers.CharField(max_length=500, required=False, allow_null=True, allow_blank=True)
    external_required = serializers.BooleanField(default=False)
    platform_field = serializers.CharField(max_length=255)
    platform_data_type = serializers.ChoiceField(
        choices=[("string", "String"), ("number", "Number"), ("boolean", "Boolean"),
                 ("date", "Date"), ("datetime", "DateTime"), ("json", "JSON Object"), ("array", "Array")],
        default="string"
    )
    transform_type = serializers.ChoiceField(
        choices=[("direct", "Direct (1:1)"), ("concat", "Concatenate"),
                 ("format", "Format String"), ("lookup", "Lookup / Enum Map"),
                 ("custom", "Custom Transform")],
        default="direct"
    )
    transform_config = serializers.JSONField(default=dict, required=False)
    default_value = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_required = serializers.BooleanField(default=False)
    order = serializers.IntegerField(default=0)


class IntegrationConfigSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    field_mappings = FieldMappingSerializer(many=True, required=False)

    class Meta:
        model = IntegrationConfig
        fields = [
            "id", "organization", "organization_name",
            "auth_type", "api_key", "api_key_header_name", "auth_config",
            "base_url", "api_version", "api_protocol", "custom_headers",
            "timeout_seconds", "rate_limit_per_minute",
            "sync_enabled", "sync_interval_minutes", "last_sync_at", "next_sync_at",
            "sync_status", "consecutive_failures", "max_retries", "retry_backoff_minutes",
            "integration_status", "paused_at", "revoked_at", "revoked_by", "revocation_reason",
            "webhook_url", "webhook_secret", "webhook_enabled", "webhook_events",
            "connection_health", "last_health_check_at", "last_error_message",
            "setup_completed_at", "setup_step",
            "field_mappings",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "last_sync_at", "next_sync_at", "sync_status",
            "consecutive_failures", "connection_health", "last_health_check_at",
            "last_error_message", "paused_at", "revoked_at", "revoked_by",
            "setup_completed_at", "created_at", "updated_at",
        ]
        extra_kwargs = {
            "api_key": {"write_only": True, "required": False},
            "auth_config": {"required": False},
            "webhook_secret": {"write_only": True, "required": False},
            "custom_headers": {"required": False},
        }

    def validate_auth_type(self, value):
        valid_types = dict(IntegrationConfig.AUTH_TYPE_CHOICES).keys()
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid auth_type. Must be one of: {list(valid_types)}")
        return value

    def validate_api_protocol(self, value):
        valid_protocols = dict(IntegrationConfig.API_PROTOCOL_CHOICES).keys()
        if value not in valid_protocols:
            raise serializers.ValidationError(f"Invalid api_protocol. Must be one of: {list(valid_protocols)}")
        return value

    def validate_integration_status(self, value):
        valid_statuses = dict(IntegrationConfig.INTEGRATION_STATUS_CHOICES).keys()
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid integration_status. Must be one of: {list(valid_statuses)}")
        return value

    def validate(self, attrs):
        # Only enforce base_url when auth fields are being set/changed AND base_url is absent
        auth_type = attrs.get("auth_type") or (getattr(self.instance, "auth_type", None) if self.instance else None)
        base_url = attrs.get("base_url") or (getattr(self.instance, "base_url", None) if self.instance else None)

        # Only validate if auth_type is being set AND no base_url is available anywhere
        if "auth_type" in attrs or "base_url" in attrs:
            if auth_type in ["api_key", "bearer_token", "custom_header"] and not base_url:
                raise serializers.ValidationError(
                    {"base_url": "base_url is required for API key / Bearer token / Custom header auth types"}
                )
        return attrs



class IntegrationConfigSetupSerializer(serializers.Serializer):
    """Serializer for multi-step integration setup wizard"""
    step = serializers.IntegerField(min_value=1, max_value=4)
    auth_type = serializers.ChoiceField(choices=IntegrationConfig.AUTH_TYPE_CHOICES, required=False)
    base_url = serializers.URLField(required=False)
    api_version = serializers.CharField(max_length=50, required=False, allow_blank=True)
    api_protocol = serializers.ChoiceField(choices=IntegrationConfig.API_PROTOCOL_CHOICES, required=False, default="rest")
    auth_config = serializers.JSONField(required=False, default=dict)
    api_key = serializers.CharField(required=False, allow_blank=True)
    api_key_header_name = serializers.CharField(max_length=100, required=False, default="Authorization")
    custom_headers = serializers.JSONField(required=False, default=dict)
    timeout_seconds = serializers.IntegerField(default=30, min_value=5, max_value=300)
    rate_limit_per_minute = serializers.IntegerField(default=60, min_value=1, max_value=1000)
    sync_enabled = serializers.BooleanField(default=True)
    sync_interval_minutes = serializers.IntegerField(default=60, min_value=5, max_value=10080)
    max_retries = serializers.IntegerField(default=3, min_value=0, max_value=10)
    retry_backoff_minutes = serializers.IntegerField(default=5, min_value=1, max_value=1440)
    field_mappings = FieldMappingSerializer(many=True, required=False)


class IntegrationStatusSerializer(serializers.Serializer):
    """Serializer for integration status response"""
    id = serializers.UUIDField()
    organization_name = serializers.CharField()
    integration_status = serializers.CharField()
    sync_enabled = serializers.BooleanField()
    sync_status = serializers.CharField()
    connection_health = serializers.CharField()
    last_sync_at = serializers.DateTimeField(allow_null=True)
    next_sync_at = serializers.DateTimeField(allow_null=True)
    consecutive_failures = serializers.IntegerField()
    last_health_check_at = serializers.DateTimeField(allow_null=True)
    last_error_message = serializers.CharField(allow_null=True)
    setup_completed_at = serializers.DateTimeField(allow_null=True)
    setup_step = serializers.IntegerField()
    can_sync = serializers.BooleanField()
    can_pause = serializers.BooleanField()
    can_revoke = serializers.BooleanField()
