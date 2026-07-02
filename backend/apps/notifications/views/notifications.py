from django.utils import timezone

from apps.notifications.models import Notification, NotificationPreference
from apps.notifications.serializers.notification import (
    MarkReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)
from common.api_response import error_response, success_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user)
        return success_response(data=NotificationSerializer(notifications, many=True).data)

    def delete(self, request):
        count, _ = Notification.objects.filter(recipient=request.user).delete()
        return success_response(message=f"Cleared {count} notifications")


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = MarkReadSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        now = timezone.now()
        Notification.objects.filter(
            recipient=request.user, id__in=s.validated_data["ids"]
        ).update(is_read=True, read_at=now)
        return success_response(message="Marked as read")


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        now = timezone.now()
        Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True, read_at=now
        )
        return success_response(message="All notifications marked as read")


class NotificationPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return success_response(data=NotificationPreferenceSerializer(prefs).data)

    def put(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        s = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        if not s.is_valid():
            return error_response(errors=s.errors)
        s.save()
        return success_response(data=s.data)


class UnreadCountView(APIView):
    """GET /notifications/unread-count/ — generic unread count for any authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.notifications.models import Notification
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return success_response(data={"unread_count": count})
