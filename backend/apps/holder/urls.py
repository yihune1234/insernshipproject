from django.urls import path

from apps.holder.views import (
    HolderCredentialDetailView,
    HolderCredentialListView,
    HolderCredentialRequestView,
    HolderRegisterView,
    HolderRequestCatalogView,
    HolderSyncView,
    PresentationDetailView,
    PresentationListView,
    ShareDetailView,
    ShareDisableView,
    ShareEnableView,
    ShareListView,
    ShareStatsView,
    WalletCredentialDetailView,
    WalletCredentialListView,
    WalletDetailView,
)

urlpatterns = [
    path("", WalletDetailView.as_view()),
    path("register/", HolderRegisterView.as_view()),

    # Credential endpoints
    path("credentials/", HolderCredentialListView.as_view()),
    path("credentials/sync/", HolderSyncView.as_view()),
    path("credentials/request/", HolderCredentialRequestView.as_view()),
    path("credentials/<uuid:pk>/", HolderCredentialDetailView.as_view()),

    # Aliases used by frontend and mobile clients
    path("my-credentials/", HolderCredentialListView.as_view()),
    path("my-credentials/<uuid:pk>/", HolderCredentialDetailView.as_view()),

    # Request catalog
    path("request-catalog/", HolderRequestCatalogView.as_view()),

    # Wallet held credentials
    path("held/", WalletCredentialListView.as_view()),
    path("held/<uuid:pk>/", WalletCredentialDetailView.as_view()),

    # Sharing — specific action endpoints must come before generic token routes
    path("shares/enable/", ShareEnableView.as_view()),
    path("shares/disable/", ShareDisableView.as_view()),
    path("shares/stats/", ShareStatsView.as_view()),
    path("shares/", ShareListView.as_view()),
    path("shares/<str:token>/", ShareDetailView.as_view()),

    # Presentations
    path("presentations/", PresentationListView.as_view()),
    path("presentations/<uuid:pk>/", PresentationDetailView.as_view()),
]
