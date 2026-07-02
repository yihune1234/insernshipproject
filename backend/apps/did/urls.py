from django.urls import path

from apps.did.views.did_auth import DIDAuthChallengeView, DIDAuthRespondView
from apps.did.views.did_crud import DIDCreateListView, DIDDetailView

urlpatterns = [
    path("", DIDCreateListView.as_view()),
    path("<str:did>/", DIDDetailView.as_view()),
    path("auth/challenge/", DIDAuthChallengeView.as_view()),
    path("auth/respond/", DIDAuthRespondView.as_view()),
]
