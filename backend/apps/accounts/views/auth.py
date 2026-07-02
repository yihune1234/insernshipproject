import logging

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import CustomUser
from apps.accounts.serializers import (
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    VerifyOTPSerializer,
)
from apps.accounts.serializers.user import UserSerializer
from apps.accounts.services import AuthService, AuthenticationException, OTPService, TokenService
from apps.notifications.services.email_service import EmailService
from common.api_response import error_response, success_response

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            user = AuthService.register(
                name=serializer.validated_data["name"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                phone=serializer.validated_data.get("phone"),
                role=serializer.validated_data.get("role", "holder")
            )
            return success_response(
                data={"user_id": str(user.id)},
                message="Registration successful. Please verify your email.",
                status_code=201,
            )
        except ValueError as e:
            return error_response(errors=str(e), status_code=400)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            user = AuthService.verify_otp(
                serializer.validated_data["user_id"], serializer.validated_data["otp"]
            )
            tokens = TokenService.issue_tokens(user)
            return success_response(data={"tokens": tokens, "user": UserSerializer(user).data})
        except Exception:
            logger.exception("OTP verification failed")
            return error_response(errors="Verification failed", status_code=400)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            user = AuthService.authenticate(
                serializer.validated_data["email"], serializer.validated_data["password"]
            )
            tokens = TokenService.issue_tokens(user)
            return success_response(data={"tokens": tokens, "user": UserSerializer(user).data})
        except AuthenticationException as e:
            return error_response(errors=str(e), status_code=401)


class LogoutView(APIView):
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
            return success_response(message="Logged out successfully")
        except TokenError:
            return error_response(errors="Invalid token", status_code=400)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            user = CustomUser.objects.get(email=serializer.validated_data["email"])
            otp = OTPService.generate(purpose="password_reset", identifier=user.email)
            try:
                EmailService.send_email(
                    to_address=user.email,
                    subject="Password Reset OTP",
                    template_name="otp",
                    context={"name": user.name, "otp": otp},
                )
            except Exception:
                pass
        except CustomUser.DoesNotExist:
            pass
        return success_response(message="If the email exists, an OTP has been sent.")


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            user = CustomUser.objects.get(email=serializer.validated_data["email"])
            OTPService.verify(
                purpose="password_reset",
                identifier=user.email,
                submitted_otp=serializer.validated_data["otp"],
            )
            user.set_password(serializer.validated_data["new_password"])
            user.save(update_fields=["password"])
            return success_response(message="Password reset successfully")
        except Exception:
            logger.exception("Password reset failed")
            return error_response(errors="Password reset failed", status_code=400)
