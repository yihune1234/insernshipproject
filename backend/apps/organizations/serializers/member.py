from rest_framework import serializers

from apps.organizations.models import OrganizationMember


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = OrganizationMember
        fields = ["id", "user", "user_email", "user_name", "role", "is_active"]
        read_only_fields = ["id"]


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=["owner", "admin", "staff"])
