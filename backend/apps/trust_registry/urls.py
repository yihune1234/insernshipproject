from django.urls import path

from apps.trust_registry.views.accreditation import (
    AccreditationApproveView,
    AccreditationDetailView,
    AccreditationListView,
    AccreditationSuspendView,
    TrustCheckView,
)

urlpatterns = [
    path("", AccreditationListView.as_view()),
    path("accreditations/", AccreditationListView.as_view()),
    path("accreditations/<uuid:pk>/", AccreditationDetailView.as_view()),
    path("accreditations/<uuid:pk>/approve/", AccreditationApproveView.as_view()),
    path("accreditations/<uuid:pk>/suspend/", AccreditationSuspendView.as_view()),
    path("check/<uuid:org_id>/", TrustCheckView.as_view()),
]
