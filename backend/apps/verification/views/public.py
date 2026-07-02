from apps.verification.serializers.verification import PublicVerifySerializer
from apps.verification.services import VerificationEngine
from common.api_response import error_response, success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class PublicVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PublicVerifySerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)

        credential_id = s.validated_data.get("credential_id")
        token = s.validated_data.get("token")

        if not credential_id and not token:
            return error_response(errors="credential_id or token is required")

        if token and not credential_id:
            from apps.holder.models import CredentialShare
            from django.utils import timezone
            try:
                share = CredentialShare.objects.get(token=token, is_active=True)
                if share.expires_at < timezone.now():
                    return error_response(errors="Share link has expired", status_code=410)
                share.access_count += 1
                share.save(update_fields=["access_count"])
                credential_id = share.credential.credential_id
            except CredentialShare.DoesNotExist:
                return error_response(errors="Share link not found", status_code=404)

        result = VerificationEngine.verify(credential_id=credential_id, requesting_user=None)
        return success_response(data=result)
