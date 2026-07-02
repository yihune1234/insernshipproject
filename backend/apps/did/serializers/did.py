from rest_framework import serializers

from apps.did.models import DIDDocument, DIDKey


class DIDDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DIDDocument
        fields = ["id", "did", "document", "status", "created_at"]
        read_only_fields = ["id", "did", "document", "created_at"]


class DIDKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = DIDKey
        fields = ["id", "public_key_hex", "key_type", "purpose", "is_active"]
        read_only_fields = ["id", "public_key_hex", "key_type"]


class DIDAuthChallengeSerializer(serializers.Serializer):
    did = serializers.CharField()


class DIDAuthRespondSerializer(serializers.Serializer):
    did = serializers.CharField()
    challenge = serializers.CharField()
    signature = serializers.CharField()
