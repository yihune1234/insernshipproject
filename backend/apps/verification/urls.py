from django.urls import path

from apps.verification.views.history import VerificationHistoryDetailView, VerificationHistoryListView
from apps.verification.views.public import PublicVerifyView
from apps.verification.views.verify import VerifyView

urlpatterns = [
    path("verify/", VerifyView.as_view()),
    path("public/verify/", PublicVerifyView.as_view()),
    path("history/", VerificationHistoryListView.as_view()),
    path("history/<uuid:pk>/", VerificationHistoryDetailView.as_view()),
]
