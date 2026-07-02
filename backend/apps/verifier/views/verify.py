from apps.verification.services import VerificationEngine
from common.api_response import error_response, success_response
from rest_framework.views import APIView


class VerifierVerifyView(APIView):
    def post(self, request):
        credential_id = request.data.get("credential_id")
        if not credential_id:
            return error_response(errors="credential_id is required")
        result = VerificationEngine.verify(credential_id=credential_id, requesting_user=request.user)
        return success_response(data=result)
