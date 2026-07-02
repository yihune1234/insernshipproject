from django.urls import path

from apps.admin_portal.views import (
    AdminOrganizationApproveView,
    AdminOrganizationDetailView,
    AdminOrganizationListView,
    AdminOrganizationPendingView,
    AdminOrganizationRejectView,
    AdminUserActivateView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserSuspendView,
    DashboardView,
)
from apps.admin_portal.views.reports import (
    SynchronizationReportView,
    OrganizationReportView,
    VerificationReportView,
    IntegrationReportView,
    AuditReportView,
)
from apps.admin_portal.views.integrations import (
    AdminIntegrationListView,
    AdminIntegrationDetailView,
    AdminIntegrationRetryView,
    AdminIntegrationDisableView,
)
from apps.admin_portal.views.verification import (
    AdminVerificationLogsView,
    AdminVerificationStatsView,
    AdminRevokedCredentialsView,
    AdminExpiredCredentialsView,
)
from apps.admin_portal.views.credentials import (
    AdminSynchronizedCredentialsView,
    AdminCredentialStatusView,
    AdminHolderManagementView,
)
from common.permissions import IsAdmin
from rest_framework.views import APIView
from common.api_response import success_response


urlpatterns = [
    # Dashboard
    path("", DashboardView.as_view()),
    path("dashboard/", DashboardView.as_view()),
    
    # User Management
    path("users/", AdminUserListView.as_view()),
    path("users/<uuid:pk>/", AdminUserDetailView.as_view()),
    path("users/<uuid:pk>/suspend/", AdminUserSuspendView.as_view()),
    path("users/<uuid:pk>/activate/", AdminUserActivateView.as_view()),
    
    # Organization Management
    path("organizations/", AdminOrganizationListView.as_view()),
    path("organizations/pending/", AdminOrganizationPendingView.as_view()),
    path("organizations/<uuid:pk>/", AdminOrganizationDetailView.as_view()),
    path("organizations/<uuid:pk>/approve/", AdminOrganizationApproveView.as_view()),
    path("organizations/<uuid:pk>/reject/", AdminOrganizationRejectView.as_view()),
    
    # Integration Monitoring
    path("integrations/", AdminIntegrationListView.as_view()),
    path("integrations/<uuid:pk>/", AdminIntegrationDetailView.as_view()),
    path("integrations/<uuid:pk>/retry/", AdminIntegrationRetryView.as_view()),
    path("integrations/<uuid:pk>/disable/", AdminIntegrationDisableView.as_view()),
    
    # Credential Monitoring (synchronized credentials only)
    path("credentials/synchronized/", AdminSynchronizedCredentialsView.as_view()),
    path("credentials/status/", AdminCredentialStatusView.as_view()),
    
    # Holder Management
    path("holders/", AdminHolderManagementView.as_view()),
    
    # Verification Monitoring
    path("verifications/logs/", AdminVerificationLogsView.as_view()),
    path("verifications/stats/", AdminVerificationStatsView.as_view()),
    path("verifications/revoked/", AdminRevokedCredentialsView.as_view()),
    path("verifications/expired/", AdminExpiredCredentialsView.as_view()),
    
    # Reports
    path("reports/synchronization/", SynchronizationReportView.as_view()),
    path("reports/organizations/", OrganizationReportView.as_view()),
    path("reports/verifications/", VerificationReportView.as_view()),
    path("reports/integrations/", IntegrationReportView.as_view()),
    path("reports/audit/", AuditReportView.as_view()),
]

