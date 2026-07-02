from rest_framework import serializers


class IssueCredentialSerializer(serializers.Serializer):
    credential_id = serializers.CharField()
    national_id = serializers.CharField(required=False, allow_blank=True, default="")
    credential_type = serializers.CharField(required=False, allow_blank=True, default="")
    title = serializers.CharField(required=False, allow_blank=True, default="")
    data = serializers.JSONField(required=False, default=dict)
    issued_at = serializers.DateTimeField(required=False)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    signature = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    signature_algorithm = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    raw_payload = serializers.CharField(required=False, allow_blank=True, allow_null=True)
