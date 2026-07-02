from rest_framework import serializers


class ReceiveCredentialSerializer(serializers.Serializer):
    credential_id = serializers.CharField(max_length=255)
    national_id = serializers.CharField(max_length=255)
    credential_type = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=255)
    data = serializers.DictField(required=False, default=dict)
    issued_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    signature = serializers.CharField(required=False, allow_null=True)
    signature_algorithm = serializers.CharField(required=False, allow_null=True)
    raw_payload = serializers.CharField(required=False, allow_null=True)


class RevokeCredentialSerializer(serializers.Serializer):
    credential_id = serializers.CharField(max_length=255)
    reason = serializers.CharField(required=False, allow_blank=True)
