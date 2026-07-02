from common.api_response import success_response
from common.permissions import IsVerifier
from rest_framework.views import APIView


class VerifierRegisterView(APIView):
    def post(self, request):
        user = request.user
        user.role = "verifier"
        user.save(update_fields=["role"])
        return success_response(data={"message": "Registered as verifier", "user_id": str(user.id)})
