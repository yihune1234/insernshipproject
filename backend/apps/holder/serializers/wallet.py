from rest_framework import serializers

from apps.holder.models import HeldCredential, Wallet


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["id", "name", "created_at"]


class HeldCredentialSerializer(serializers.ModelSerializer):
    credential_title = serializers.CharField(source="credential.title", read_only=True)
    credential_type = serializers.CharField(source="credential.credential_type", read_only=True)

    class Meta:
        model = HeldCredential
        fields = ["id", "credential", "credential_title", "credential_type", "alias", "is_pinned", "added_at"]
