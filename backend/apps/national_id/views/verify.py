import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.permissions import IsHolder
from apps.national_id.serializers.verification import ConfirmSerializer, InitiateSerializer
from apps.national_id.services.kyc_service import KYCService
from common.api_response import error_response, success_response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class InitiateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Initiate National ID verification.
        This endpoint is public (AllowAny) and CSRF exempt because it's
        the first step in the registration flow — the user has no account yet.
        """
        serializer = InitiateSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return error_response(errors=serializer.errors)
        try:
            result = KYCService.get_service().initiate(None, serializer.validated_data["fin"])
            return success_response(data=result)
        except Exception:
            logger.exception("National ID initiation failed")
            return error_response(errors="National ID verification initiation failed")


class ConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsHolder]

    def post(self, request):
        if request.user.role != "holder":
            return error_response(
                errors="Only holder accounts can confirm national ID verification",
                status_code=403
            )

        serializer = ConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        try:
            result = KYCService.get_service().confirm(
                str(serializer.validated_data["session_id"]),
                serializer.validated_data["otp"],
            )
            return success_response(data=result)
        except Exception:
            logger.exception("National ID confirmation failed")
            return error_response(errors="National ID verification confirmation failed")


class StatusView(APIView):
    permission_classes = [IsAuthenticated, IsHolder]

    def get(self, request):
        if request.user.role != "holder":
            return error_response(
                errors="Only holder accounts can check national ID verification status",
                status_code=403
            )

        return success_response(
            data={"national_id_verified": request.user.national_id_verified}
        )
