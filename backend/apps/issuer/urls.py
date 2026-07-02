from django.urls import path

from apps.issuer.views import (
    IntegrationAnalyticsView,
    IntegrationConfigDetailView,
    IntegrationConfigListView,
    IntegrationHealthView,
    IntegrationSyncView,
    IssuerCredentialBulkView,
    IssuerCredentialStatusView,
    IssuerCredentialView,
    IssuerMemberCheckView,
    IssuerMemberListView,
    IssuerOrgMemberDetailView,
    IssuerOrgMemberView,
    IssuerOrganizationView,
    LiveSyncTriggerView,
    OrgIntegrationAnalyticsView,
    SyncLogsView,
)

from apps.notifications.views.issuer import IssuerNotificationStreamView, IssuerUnreadCountView

urlpatterns = [
    path("organization/", IssuerOrganizationView.as_view()),
    path("organization/members/", IssuerOrgMemberView.as_view()),
    path("organization/members/<uuid:user_id>/", IssuerOrgMemberDetailView.as_view()),
    path("notifications/unread-count/", IssuerUnreadCountView.as_view()),
    path("notifications/stream/", IssuerNotificationStreamView.as_view()),
    path("", IntegrationConfigListView.as_view()),
    path("configs/", IntegrationConfigListView.as_view()),
    path("configs/<uuid:org_id>/", IntegrationConfigDetailView.as_view()),
    path("configs/<uuid:org_id>/sync/", IntegrationSyncView.as_view()),
    path("configs/<uuid:org_id>/health/", IntegrationHealthView.as_view()),
    path("sync/", LiveSyncTriggerView.as_view()),
    path("sync/logs/", SyncLogsView.as_view()),
    path("analytics/", IntegrationAnalyticsView.as_view()),
    path("analytics/<uuid:org_id>/", OrgIntegrationAnalyticsView.as_view()),
    path("credentials/", IssuerCredentialView.as_view()),
    path("credentials/bulk/", IssuerCredentialBulkView.as_view()),
    path("credentials/<str:credential_id>/status/", IssuerCredentialStatusView.as_view()),
    path("members/", IssuerMemberListView.as_view()),
    path("members/check/", IssuerMemberCheckView.as_view()),
]
