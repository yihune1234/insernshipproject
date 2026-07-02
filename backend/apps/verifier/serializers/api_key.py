from rest_framework import serializers

from apps.verifier.models import VerifierAPIKey


class VerifierAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = VerifierAPIKey
        fields = ["id", "name", "prefix", "is_active", "last_used_at", "created_at"]
        read_only_fields = ["id", "prefix", "last_used_at", "created_at"]


class CreateAPIKeySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
