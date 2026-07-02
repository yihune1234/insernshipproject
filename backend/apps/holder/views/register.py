import logging

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomUser
from apps.accounts.services.otp_service import OTPService
from apps.did.services import DIDService
from apps.holder.services import WalletService
from apps.national_id.models import NationalIDVerification
from common.api_response import error_response, success_response

logger = logging.getLogger(__name__)


class HolderRegisterView(APIView):
    """
    Register a new holder wallet account.
    This is the final step in the mobile registration flow after OTP+ PIN confirmation.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        national_id = request.data.get("national_id")
        otp = request.data.get("otp")
        phone = request.data.get("phone", "")
        device_id = request.data.get("device_id", "")
        public_key = request.data.get("public_key", "")

        if not national_id:
            return error_response(errors="national_id is required")

        if not otp:
            return error_response(errors="otp is required")

        try:
            # Verify the OTP against the stored session
            verification = NationalIDVerification.objects.filter(
                fin=national_id, verified=False
            ).order_by("-created_at").first()

            if verification:
                try:
                    OTPService.verify(
                        purpose="fayda",
                        identifier=str(verification.session_id),
                        submitted_otp=otp,
                    )
                except Exception:
                    return error_response(errors="Invalid or expired OTP", status_code=400)

                verification.verified = True
                verification.save(update_fields=["verified"])
            else:
                logger.warning("No pending verification found for fin=%s", national_id)

            # Create or get existing user
            user, created = CustomUser.objects.get_or_create(
                username=national_id,
                defaults={
                    "email": f"{national_id.lower()}@wallet.et",
                    "phone": phone,
                    "role": "holder",
                    "national_id": national_id,
                    "national_id_verified": True,
                },
            )

            if not created:
                user.national_id_verified = True
                if phone:
                    user.phone = phone
                user.save(update_fields=["national_id_verified", "phone"])

            wallet = WalletService.get_or_create(user)

            did_service = DIDService()
            did_doc = did_service.create_did(user)
            did_string = str(did_doc.id) if hasattr(did_doc, 'id') else f"did:et:holder:{user.id}"

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            logger.info("Holder registered: user=%s, did=%s, wallet=%s", user.id, did_string, wallet.id)

            return success_response(data={
                "user_id": str(user.id),
                "did": did_string,
                "wallet_id": str(wallet.id),
                "wallet_name": "Debo Wallet",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "name": user.name or user.username,
                "full_name": user.name or user.username,
                "phone": user.phone or phone,
            }, status_code=201)

        except Exception:
            logger.exception("Holder registration failed")
            return error_response(errors="Holder registration failed", status_code=400)
