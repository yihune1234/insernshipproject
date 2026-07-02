from django.db import models

from common.models import BaseModel


class FieldMapping(BaseModel):
    DATA_TYPE_CHOICES = [
        ("string", "String"),
        ("number", "Number"),
        ("boolean", "Boolean"),
        ("date", "Date"),
        ("datetime", "DateTime"),
        ("json", "JSON Object"),
        ("array", "Array"),
    ]

    TRANSFORM_TYPE_CHOICES = [
        ("direct", "Direct (1:1)"),
        ("concat", "Concatenate"),
        ("format", "Format String"),
        ("lookup", "Lookup / Enum Map"),
        ("custom", "Custom Transform"),
    ]

    integration = models.ForeignKey(
        "issuer.IntegrationConfig",
        on_delete=models.CASCADE,
        related_name="field_mappings",
    )

    # External system field
    external_field = models.CharField(max_length=255,
        help_text="Field name/path in the external system")
    external_data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default="string")
    external_field_path = models.CharField(max_length=500, blank=True, null=True,
        help_text="JSONPath or dot-notation path for nested fields")
    external_required = models.BooleanField(default=False)

    # Platform field
    platform_field = models.CharField(max_length=255,
        help_text="Target field name in the platform data model")
    platform_data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default="string")

    # Transformation
    transform_type = models.CharField(max_length=20, choices=TRANSFORM_TYPE_CHOICES, default="direct")
    transform_config = models.JSONField(default=dict, blank=True,
        help_text="Configuration for the transformation (format string, enum map, etc.)")
    default_value = models.TextField(blank=True, null=True,
        help_text="Default value if external field is missing")
    is_required = models.BooleanField(default=False,
        help_text="Whether mapping is required for sync to proceed")

    order = models.IntegerField(default=0)

    class Meta:
        db_table = "issuer_field_mapping"
        ordering = ["order", "created_at"]
        unique_together = [["integration", "external_field"], ["integration", "platform_field"]]

    def __str__(self):
        return f"{self.external_field} -> {self.platform_field}"
