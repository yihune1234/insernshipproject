from apps.accounts.models import PushToken
from common.api_response import error_response, success_response
from rest_framework.views import APIView


class PushTokenView(APIView):
    def post(self, request):
        push_token = request.data.get("push_token")
        platform = request.data.get("platform", "expo")
        if not push_token:
            return error_response(errors="push_token is required", status_code=400)
        PushToken.objects.update_or_create(
            user=request.user,
            defaults={"token": push_token, "platform": platform, "is_active": True},
        )
        return success_response(message="Push token registered")

    def delete(self, request):
        push_token = request.data.get("push_token")
        if push_token:
            PushToken.objects.filter(user=request.user, token=push_token).update(is_active=False)
        else:
            PushToken.objects.filter(user=request.user).update(is_active=False)
        return success_response(message="Push token unregistered")
