import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.holder.models import CredentialShare


class ShareService:
    @classmethod
    def create(cls, credential, holder, disclosed_claims: list, expires_in_hours: int = 24):
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=expires_in_hours)
        share = CredentialShare.objects.create(
            credential=credential,
            holder=holder,
            token=token,
            disclosed_claims=disclosed_claims,
            expires_at=expires_at,
        )
        share_url = f"{settings.PLATFORM_BASE_URL}/verify/{token}"
        return share_url, token

    @classmethod
    def deactivate(cls, token: str, holder):
        CredentialShare.objects.filter(token=token, holder=holder).update(is_active=False)
