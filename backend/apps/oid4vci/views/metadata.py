from django.conf import settings

from common.api_response import success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class CredentialIssuerMetadataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.credentials.models import Credential
        credential_types = list(
            Credential.objects.filter(status="active")
            .values_list("credential_type", flat=True)
            .distinct()
        )
        return success_response(data={
            "issuer": settings.PLATFORM_BASE_URL,
            "credential_endpoint": f"{settings.PLATFORM_BASE_URL}/api/verification/public/verify/",
            "credentials_supported": [{"type": ct} for ct in credential_types],
        })
