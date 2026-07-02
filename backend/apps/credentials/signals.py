import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.credentials.services.credential_service import CredentialService
from apps.national_id.models import NationalIDVerification

logger = logging.getLogger(__name__)


def connect_signals():

    @receiver(post_save, sender=NationalIDVerification)
    def on_national_id_verified(sender, instance, created, **kwargs):
        if instance.verified:
            try:
                count = CredentialService.match_pending(instance.user, instance.fin)
                if count:
                    logger.info("Matched %d pending credentials for user %s", count, instance.user.id)
            except Exception as e:
                logger.error("Error matching credentials after NID verification: %s", e)
