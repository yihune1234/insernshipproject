from apps.admin_portal.services import StatsService
from common.api_response import success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class DashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = StatsService.get_dashboard_stats()
        return success_response(data=stats)
