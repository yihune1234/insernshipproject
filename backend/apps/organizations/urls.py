from django.urls import path

from apps.organizations.models import OrganizationType
from apps.organizations.serializers import OrganizationTypeSerializer
from apps.organizations.views import (
    MemberDetailView,
    MemberListView,
    OrganizationLogoView,
    OrganizationProfileView,
    RegistrationStatusView,
    RegistrationStep1VerifyView,
    RegistrationStep1View,
    RegistrationStep2View,
    RegistrationStep3View,
    RegistrationStep4View,
    RegistrationStep5View,
)
from common.api_response import success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class OrganizationTypesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        types = OrganizationType.objects.filter(is_active=True)
        return success_response(data=OrganizationTypeSerializer(types, many=True).data)


urlpatterns = [
    path("", OrganizationTypesView.as_view()),
    path("register/step-1/", RegistrationStep1View.as_view()),
    path("register/step-1/verify/", RegistrationStep1VerifyView.as_view()),
    path("register/step-2/", RegistrationStep2View.as_view()),
    path("register/step-3/", RegistrationStep3View.as_view()),
    path("register/step-4/", RegistrationStep4View.as_view()),
    path("register/step-5/", RegistrationStep5View.as_view()),
    path("register/status/<uuid:pk>/", RegistrationStatusView.as_view()),
    path("profile/", OrganizationProfileView.as_view()),
    path("profile/logo/", OrganizationLogoView.as_view()),
    path("members/", MemberListView.as_view()),
    path("members/<uuid:user_id>/", MemberDetailView.as_view()),
    path("types/", OrganizationTypesView.as_view()),
]
