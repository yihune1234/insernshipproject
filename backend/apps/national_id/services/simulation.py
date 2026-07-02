import logging
from datetime import timezone

from django.utils import timezone as dj_timezone

from apps.accounts.services.otp_service import OTPService
from apps.national_id.models import NationalIDVerification

logger = logging.getLogger(__name__)


class NationalIDSimulation:
    def initiate(self, user, fin: str):
        """
        Initiate National ID verification.
        If user is None (pre-registration flow), create a session without a user link.
        """
        verification_data = {"fin": fin, "verified": False}
        if user is not None:
            verification, _ = NationalIDVerification.objects.update_or_create(
                user=user, defaults=verification_data
            )
        else:
            verification = NationalIDVerification.objects.create(**verification_data)
        
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        from django.conf import settings
        result = {"session_id": str(verification.session_id), "masked_phone": "+251******78"}
        logger.info("=" * 60)
        logger.info(f"National ID verification initiated — fin={fin}")
        logger.info(f"Session ID: {verification.session_id}")
        if settings.DEBUG:
            result["test_otp"] = otp
            logger.info(f"DEBUG MODE — test_otp={otp}")
        logger.info("=" * 60)
        print(f"\n{'='*60}")
        print(f"NID VERIFICATION INITIATED — fin={fin}")
        print(f"Session ID: {verification.session_id}")
        if settings.DEBUG:
            print(f"Test OTP: {otp}")
        print(f"{'='*60}\n")
        return result

    def confirm(self, session_id: str, otp: str):
        from apps.accounts.services.otp_service import InvalidOTPException
        try:
            verification = NationalIDVerification.objects.select_related("user").get(
                session_id=session_id
            )
        except NationalIDVerification.DoesNotExist:
            raise ValueError("Session not found")
        OTPService.verify(purpose="fayda", identifier=str(session_id), submitted_otp=otp)
        verification.verified = True
        verification.verified_at = dj_timezone.now()
        verification.save(update_fields=["verified", "verified_at"])
        user = verification.user
        user.national_id_verified = True
        user.save(update_fields=["national_id_verified"])
        return {"success": True, "national_id_verified": True}
