from django.urls import path

from apps.audit.views.logs import AuditLogDetailView, AuditLogListView

urlpatterns = [
    path("", AuditLogListView.as_view()),
    path("logs/", AuditLogListView.as_view()),
    path("logs/<int:pk>/", AuditLogDetailView.as_view()),
]
