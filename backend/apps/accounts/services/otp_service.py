import hmac
import logging
import secrets

from django.core.cache import cache

logger = logging.getLogger(__name__)


class InvalidOTPException(Exception):
    pass


class OTPService:
    @staticmethod
    def generate(purpose: str, identifier: str) -> str:
        otp = str(secrets.randbelow(1000000)).zfill(6)
        cache_key = f"otp:{purpose}:{identifier}"
        cache.set(cache_key, otp, timeout=600)
        logger.info("=" * 60)
        logger.info(f"OTP GENERATED — purpose={purpose}, identifier={identifier}")
        logger.info(f"OTP: {otp}")
        logger.info(f"Expires: 10 minutes")
        logger.info("=" * 60)
        print(f"\n{'='*60}")
        print(f"OTP GENERATED — purpose={purpose}, identifier={identifier}")
        print(f"OTP: {otp}")
        print(f"{'='*60}\n")
        return otp

    @staticmethod
    def verify(purpose: str, identifier: str, submitted_otp: str) -> bool:
        cache_key = f"otp:{purpose}:{identifier}"
        stored_otp = cache.get(cache_key)
        if stored_otp is None:
            raise InvalidOTPException("OTP expired or not found")
        if not hmac.compare_digest(str(stored_otp), str(submitted_otp)):
            raise InvalidOTPException("Invalid OTP")
        cache.delete(cache_key)
        return True
