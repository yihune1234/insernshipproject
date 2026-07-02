from apps.did.models import DIDDocument
from apps.did.serializers.did import DIDDocumentSerializer
from apps.did.services import DIDService
from common.api_response import error_response, success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class DIDCreateListView(APIView):
    def get(self, request):
        docs = DIDDocument.objects.filter(owner=request.user, status="active")
        return success_response(data=DIDDocumentSerializer(docs, many=True).data)

    def post(self, request):
        did_doc = DIDService.create_for_user(request.user)
        return success_response(data=DIDDocumentSerializer(did_doc).data, status_code=201)


class DIDDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return super().get_permissions()

    def get(self, request, did):
        try:
            doc = DIDDocument.objects.get(did=did)
            return success_response(data=DIDDocumentSerializer(doc).data)
        except DIDDocument.DoesNotExist:
            return error_response(errors="DID not found", status_code=404)

    def put(self, request, did):
        try:
            doc = DIDDocument.objects.get(did=did, owner=request.user)
            s = DIDDocumentSerializer(doc, data=request.data, partial=True)
            if not s.is_valid():
                return error_response(errors=s.errors)
            s.save()
            return success_response(data=s.data, message="DID updated")
        except DIDDocument.DoesNotExist:
            return error_response(errors="DID not found", status_code=404)

    def patch(self, request, did):
        return self.put(request, did)

    def delete(self, request, did):
        try:
            doc = DIDDocument.objects.get(did=did, owner=request.user)
            doc.status = "deactivated"
            doc.save(update_fields=["status"])
            return success_response(message="DID deactivated")
        except DIDDocument.DoesNotExist:
            return error_response(errors="DID not found", status_code=404)
