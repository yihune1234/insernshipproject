from apps.verification.models import VerificationHistory
from apps.verification.serializers.result import VerificationHistorySerializer
from common.api_response import error_response, success_response
from rest_framework.views import APIView


class VerificationHistoryListView(APIView):
    def get(self, request):
        history = VerificationHistory.objects.filter(verifier=request.user)
        return success_response(data=VerificationHistorySerializer(history, many=True).data)

    def delete(self, request):
        count, _ = VerificationHistory.objects.filter(verifier=request.user).delete()
        return success_response(message=f"Deleted {count} history entries")


class VerificationHistoryDetailView(APIView):
    def get(self, request, pk):
        try:
            item = VerificationHistory.objects.get(id=pk, verifier=request.user)
            return success_response(data=VerificationHistorySerializer(item).data)
        except VerificationHistory.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def delete(self, request, pk):
        try:
            item = VerificationHistory.objects.get(id=pk, verifier=request.user)
            item.delete()
            return success_response(message="History entry deleted")
        except VerificationHistory.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
