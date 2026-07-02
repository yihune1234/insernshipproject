from rest_framework import serializers

from apps.credentials.models import Credential


class CredentialSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = Credential
        fields = [
            "id", "credential_id", "organization", "organization_name",
            "credential_type", "title", "data", "issued_at", "expires_at",
            "status", "national_id", "revoked_at", "revocation_reason",
            "last_synced_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
