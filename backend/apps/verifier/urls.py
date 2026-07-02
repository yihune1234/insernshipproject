from django.urls import path

from apps.verifier.views import (
    AnalyticsView,
    APIKeyDetailView,
    APIKeyListView,
    VerifierRegisterView,
    VerifierVerifyView,
)


urlpatterns = [
    path("", APIKeyListView.as_view()),
    path("register/", VerifierRegisterView.as_view()),
    path("api-keys/", APIKeyListView.as_view()),
    path("api-keys/<uuid:pk>/", APIKeyDetailView.as_view()),
    path("api-keys/<uuid:pk>/rotate/", APIKeyDetailView.as_view()),
    path("analytics/", AnalyticsView.as_view()),
    path("verify/", VerifierVerifyView.as_view()),
]
