from apps.holder.models import Presentation
from apps.holder.serializers import CreatePresentationSerializer, PresentationSerializer
from apps.holder.services import PresentationService
from common.api_response import error_response, success_response
from common.permissions import IsHolder
from rest_framework.views import APIView


class PresentationListView(APIView):
    permission_classes = [IsHolder]

    def get(self, request):
        presentations = Presentation.objects.filter(holder=request.user).order_by("-created_at")
        return success_response(data=PresentationSerializer(presentations, many=True).data)

    def post(self, request):
        s = CreatePresentationSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        pres = PresentationService.create(request.user, s.validated_data["credentials"])
        return success_response(data=PresentationSerializer(pres).data, status_code=201)


class PresentationDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request, pk):
        try:
            pres = Presentation.objects.get(id=pk, holder=request.user)
            return success_response(data=PresentationSerializer(pres).data)
        except Presentation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def delete(self, request, pk):
        try:
            pres = Presentation.objects.get(id=pk, holder=request.user)
            pres.delete()
            return success_response(message="Presentation deleted")
        except Presentation.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
