from django.conf import settings

from common.api_response import success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class OpenIDConfigurationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        base = settings.PLATFORM_BASE_URL
        return success_response(data={
            "issuer": base,
            "authorization_endpoint": f"{base}/api/auth/login/",
            "token_endpoint": f"{base}/api/auth/token/refresh/",
            "jwks_uri": f"{base}/.well-known/jwks/",
            "response_types_supported": ["code"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["EdDSA"],
        })
