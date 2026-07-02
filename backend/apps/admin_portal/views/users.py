from apps.accounts.models import CustomUser
from apps.accounts.serializers.user import UserSerializer
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class AdminUserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = CustomUser.objects.all().order_by("-created_at")
        return success_response(data=UserSerializer(users, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            user = CustomUser.objects.get(id=pk)
            return success_response(data=UserSerializer(user).data)
        except CustomUser.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class AdminUserSuspendView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(id=pk)
            user.is_active = False
            user.save(update_fields=["is_active"])
            return success_response(message="User suspended")
        except CustomUser.DoesNotExist:
            return error_response(errors="Not found", status_code=404)


class AdminUserActivateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(id=pk)
            user.is_active = True
            user.save(update_fields=["is_active"])
            return success_response(message="User activated")
        except CustomUser.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
