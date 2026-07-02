import logging

from django.conf import settings
from django.contrib.auth import authenticate

from apps.accounts.models import CustomUser
from apps.accounts.services.otp_service import InvalidOTPException, OTPService

logger = logging.getLogger(__name__)


class AuthenticationException(Exception):
    pass


class AuthService:
    VALID_ROLES = ["holder", "issuer", "verifier", "admin"]

    @classmethod
    def register(cls, name, email, password, phone=None, role="holder"):
        if CustomUser.objects.filter(email=email).exists():
            raise ValueError("Email already registered")
        
        # Validate role
        if role not in cls.VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(cls.VALID_ROLES)}")
        
        # Only admins can register issuer/verifier/admin roles
        # Self-service registration defaults to holder
        if role != "holder":
            raise ValueError("Only admins can create issuer, verifier, and admin accounts")

        auto_activate = getattr(settings, "DEV_AUTO_ACTIVATE_USERS", False)
        user = CustomUser.objects.create_user(
            email=email,
            name=name,
            password=password,
            phone=phone,
            role=role,
            is_active=auto_activate,
            is_verified=auto_activate,
        )

        if not auto_activate:
            otp = OTPService.generate(purpose="registration", identifier=email)
            try:
                from apps.notifications.services.email_service import EmailService
                EmailService.send_email(
                    to_address=email,
                    subject="Verify your account",
                    template_name="otp",
                    context={"name": name, "otp": otp},
                )
            except Exception:
                logger.warning("Failed to send registration OTP email to %s", email)
        return user

    @classmethod
    def verify_otp(cls, user_id, otp):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise ValueError("User not found")
        OTPService.verify(purpose="registration", identifier=user.email, submitted_otp=otp)
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=["is_active", "is_verified"])
        return user

    @classmethod
    def authenticate(cls, email, password):
        user = authenticate(username=email, password=password)
        if user is None:
            raise AuthenticationException("Invalid credentials")
        if not user.is_active:
            raise AuthenticationException("Account not verified")
        return user
