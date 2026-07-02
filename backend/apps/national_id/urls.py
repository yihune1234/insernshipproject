from django.urls import path

from apps.national_id.views.profile import ProfileView
from apps.national_id.views.verify import ConfirmView, InitiateView, StatusView

urlpatterns = [
    path("", StatusView.as_view()),
    path("initiate/", InitiateView.as_view()),
    path("confirm/", ConfirmView.as_view()),
    path("status/", StatusView.as_view()),
    path("profile/<str:fin>/", ProfileView.as_view()),
]
