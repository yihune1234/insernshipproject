from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    LoginView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PushTokenView,
    RegisterView,
    VerifyOTPView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("register/verify-otp/", VerifyOTPView.as_view()),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("password/reset/", PasswordResetRequestView.as_view()),
    path("password/reset/confirm/", PasswordResetConfirmView.as_view()),
    path("me/", MeView.as_view()),
    path("me/password/", PasswordChangeView.as_view()),
    path("push-token/", PushTokenView.as_view()),
]
