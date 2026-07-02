from django.urls import path

from apps.credentials.views import (
    CredentialDetailView,
    CredentialListView,
    PublicVerifyView,
    ReceiveCredentialView,
    RevokeCredentialView,
    SyncView,
    UpdateCredentialView,
)

urlpatterns = [
    path("", CredentialListView.as_view()),
    path("verify/", PublicVerifyView.as_view()),
    path("sync/", SyncView.as_view()),
    path("incoming/", ReceiveCredentialView.as_view()),
    path("update/", UpdateCredentialView.as_view()),
    path("revoke/", RevokeCredentialView.as_view()),
    path("<str:credential_id>/", CredentialDetailView.as_view()),
]
