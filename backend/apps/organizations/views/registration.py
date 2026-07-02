from apps.organizations.models import OrgRegistration
from apps.organizations.serializers import (
    OrgRegistrationSerializer,
    RegistrationStep1Serializer,
    RegistrationStep1VerifySerializer,
    RegistrationStep2Serializer,
)
from apps.organizations.services import RegistrationService
from common.api_response import error_response, success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class RegistrationStep1View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegistrationStep1Serializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            reg, otp = RegistrationService.process_step_1(s.validated_data["email"], s.validated_data["password"])
            data = OrgRegistrationSerializer(reg).data
            if request.META.get("SERVER_NAME") == "localhost":
                data["test_otp"] = otp
            return success_response(data=data, status_code=201)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStep1VerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegistrationStep1VerifySerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            reg = RegistrationService.process_step_1_verify(
                s.validated_data["registration_id"], s.validated_data["otp"]
            )
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStep2View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegistrationStep2Serializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            reg = RegistrationService.process_step_2(**s.validated_data)
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStep3View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        registration_id = request.data.get("registration_id")
        file = request.FILES.get("file")
        doc_type = request.data.get("document_type", "other")
        file_name = file.name if file else ""
        try:
            reg = RegistrationService.process_step_3(registration_id, doc_type, file, file_name)
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStep4View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        registration_id = request.data.get("registration_id")
        use_case = request.data.get("use_case", "")
        try:
            reg = RegistrationService.process_step_4(registration_id, use_case)
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStep5View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        registration_id = request.data.get("registration_id")
        try:
            reg = RegistrationService.process_step_5(registration_id)
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except Exception as e:
            return error_response(errors=str(e))


class RegistrationStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            reg = OrgRegistration.objects.get(id=pk)
            return success_response(data=OrgRegistrationSerializer(reg).data)
        except OrgRegistration.DoesNotExist:
            return error_response(errors="Registration not found", status_code=404)
