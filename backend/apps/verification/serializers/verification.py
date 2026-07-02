from rest_framework import serializers


class VerifySerializer(serializers.Serializer):
    credential_id = serializers.CharField()


class PublicVerifySerializer(serializers.Serializer):
    credential_id = serializers.CharField(required=False)
    token = serializers.CharField(required=False)
