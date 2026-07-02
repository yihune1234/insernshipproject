from apps.verification.serializers.verification import VerifySerializer
from apps.verification.services import VerificationEngine
from common.api_response import error_response, success_response
from rest_framework.views import APIView


class VerifyView(APIView):
    def post(self, request):
        s = VerifySerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        result = VerificationEngine.verify(
            credential_id=s.validated_data["credential_id"],
            requesting_user=request.user,
        )
        return success_response(data=result)
