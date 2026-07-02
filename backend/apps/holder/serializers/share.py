from rest_framework import serializers

from apps.holder.models import CredentialShare


class CredentialShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = CredentialShare
        fields = ["id", "credential", "token", "disclosed_claims", "expires_at", "is_active", "access_count", "created_at"]
        read_only_fields = ["id", "token", "is_active", "access_count", "created_at"]


class CreateShareSerializer(serializers.Serializer):
    credential_id = serializers.UUIDField()
    disclosed_claims = serializers.ListField(child=serializers.CharField(), default=list)
    expires_in_hours = serializers.IntegerField(default=24, min_value=1, max_value=720)
