from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.national_id.services.profile_service import ProfileService
from common.api_response import error_response, success_response


class ProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, fin: str):
        """
        Public endpoint to look up citizen profile by National ID (FIN).
        Returns basic citizen information for identity confirmation.
        """
        try:
            result = ProfileService.get_profile(fin)
            if not result:
                return error_response(errors="Profile not found", status_code=404)
            return success_response(data=result)
        except Exception as e:
            return error_response(errors=str(e))