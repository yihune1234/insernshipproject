from django.urls import path

from apps.notifications.views.notifications import (
    MarkAllReadView,
    MarkReadView,
    NotificationListView,
    NotificationPreferencesView,
    UnreadCountView,
)
from apps.notifications.views.issuer import (
    IssuerNotificationStreamView,
    IssuerUnreadCountView,
)

urlpatterns = [
    path("", NotificationListView.as_view()),
    path("unread-count/", UnreadCountView.as_view()),
    path("mark-read/", MarkReadView.as_view()),
    path("mark-all-read/", MarkAllReadView.as_view()),
    path("preferences/", NotificationPreferencesView.as_view()),
    
    # Issuer-specific endpoints
    path("issuer/unread-count/", IssuerUnreadCountView.as_view()),
    path("issuer/stream/", IssuerNotificationStreamView.as_view()),
]
