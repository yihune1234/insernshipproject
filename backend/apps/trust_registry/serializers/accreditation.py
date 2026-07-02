from rest_framework import serializers
from decimal import Decimal

from apps.trust_registry.models import Accreditation, TrustLevel


class TrustLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustLevel
        fields = "__all__"


class AccreditationSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = Accreditation
        fields = [
            "id", "organization", "organization_name", "status",
            "trust_level", "trust_score", "accredited_by", "expires_at", "notes", "created_at",
        ]
        read_only_fields = ["id", "accredited_by", "created_at"]


class AccreditationCreateSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    trust_level = serializers.IntegerField(min_value=1, max_value=5)
    trust_score = serializers.DecimalField(max_digits=4, decimal_places=3, min_value=Decimal('0'), max_value=Decimal('1'))
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
