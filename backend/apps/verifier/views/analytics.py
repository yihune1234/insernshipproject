from apps.verifier.services import AnalyticsService
from common.api_response import success_response
from common.permissions import IsVerifier
from rest_framework.views import APIView


class AnalyticsView(APIView):
    permission_classes = [IsVerifier]

    def get(self, request):
        stats = AnalyticsService.get_stats(request.user)
        return success_response(data=stats)
