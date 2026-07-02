from rest_framework import serializers

from apps.accounts.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "name", "phone", "role", "is_verified", "national_id_verified", "created_at"]
        read_only_fields = ["id", "email", "role", "is_verified", "national_id_verified", "created_at"]


class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
