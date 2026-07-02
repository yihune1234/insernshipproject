from rest_framework import serializers

from apps.holder.models import Presentation


class PresentationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presentation
        fields = ["id", "credentials", "qr_code_url", "expires_at", "created_at"]
        read_only_fields = ["id", "qr_code_url", "created_at"]


class CreatePresentationSerializer(serializers.Serializer):
    credentials = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )
