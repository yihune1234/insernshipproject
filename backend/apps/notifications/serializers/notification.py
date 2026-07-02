from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "notification_type", "is_read", "read_at", "created_at"]
        read_only_fields = ["id", "created_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "credential_received", "credential_updated", "credential_revoked",
            "verification_complete", "sync_complete", "email_notifications",
        ]


class MarkReadSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.UUIDField())
