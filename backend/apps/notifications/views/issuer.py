from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from common.api_response import success_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class IssuerUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return success_response(data={"unread_count": count})


class IssuerNotificationStreamView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')

        # Optional filter: unread only
        unread_only = request.query_params.get('unread_only')
        if unread_only and unread_only.lower() in ('true', '1'):
            qs = qs.filter(is_read=False)

        # Pagination: default to 50 most recent
        limit = min(int(request.query_params.get('limit', 50)), 200)
        qs = qs[:limit]

        return success_response(data={
            "results": NotificationSerializer(qs, many=True).data,
            "count": Notification.objects.filter(recipient=request.user).count(),
        })

