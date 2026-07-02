from apps.accounts.serializers.user import PasswordChangeSerializer, UserSerializer, UserUpdateSerializer
from common.api_response import error_response, success_response
from rest_framework.views import APIView


class MeView(APIView):
    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        user = request.user
        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save()
        return success_response(data=UserSerializer(user).data)


class PasswordChangeView(APIView):
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return error_response(errors="Current password is incorrect", status_code=400)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return success_response(message="Password changed successfully")
