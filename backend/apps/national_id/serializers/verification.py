from rest_framework import serializers


class InitiateSerializer(serializers.Serializer):
    fin = serializers.CharField(max_length=50)


class ConfirmSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    otp = serializers.CharField(max_length=6, min_length=6)
