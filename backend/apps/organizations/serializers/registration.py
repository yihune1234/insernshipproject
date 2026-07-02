from rest_framework import serializers

from apps.organizations.models import OrgRegistration


class RegistrationStep1Serializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)


class RegistrationStep1VerifySerializer(serializers.Serializer):
    registration_id = serializers.UUIDField()
    otp = serializers.CharField(max_length=6, min_length=6)


class RegistrationStep2Serializer(serializers.Serializer):
    registration_id = serializers.UUIDField()
    org_name = serializers.CharField(max_length=255)
    org_type_id = serializers.UUIDField()
    address = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True)


class OrgRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgRegistration
        fields = ["id", "email", "org_name", "status", "step", "email_verified", "submitted_at"]
        read_only_fields = ["id", "status", "step", "email_verified", "submitted_at"]
