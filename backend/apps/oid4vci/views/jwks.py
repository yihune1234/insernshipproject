import logging

from apps.did.utils.jwk import ed25519_to_jwk
from apps.organizations.models import Organization
from common.api_response import success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class JWKSView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        keys = []
        for org in Organization.objects.filter(status="approved").exclude(public_key=None):
            try:
                pub_bytes = bytes.fromhex(org.public_key)
                jwk = ed25519_to_jwk(pub_bytes, key_id=str(org.id))
                keys.append(jwk)
            except (ValueError, TypeError) as e:
                logger.warning("Failed to generate JWK for org %s: %s", org.id, e)
        return success_response(data={"keys": keys})
