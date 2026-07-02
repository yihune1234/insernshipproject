from rest_framework import serializers

from apps.organizations.models import Organization, OrganizationType


class OrganizationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationType
        fields = ["id", "name", "description", "is_active"]


class OrganizationSerializer(serializers.ModelSerializer):
    org_type = OrganizationTypeSerializer(read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id", "name", "org_type", "status", "email", "phone", "address",
            "website", "contact_person", "logo", "brand_color", "base_api_url",
            "approved_at", "created_at",
        ]
        read_only_fields = ["id", "status", "approved_at", "created_at"]
