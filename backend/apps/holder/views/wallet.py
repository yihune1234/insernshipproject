from apps.credentials.models import Credential
from apps.holder.models import Wallet
from apps.holder.serializers import HeldCredentialSerializer, WalletSerializer
from apps.holder.services import WalletService
from common.api_response import error_response, success_response
from common.permissions import IsHolder
from rest_framework.views import APIView


class WalletDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request):
        wallet = WalletService.get_or_create(request.user)
        return success_response(data=WalletSerializer(wallet).data)

    def put(self, request):
        wallet = WalletService.get_or_create(request.user)
        wallet.name = request.data.get("name", wallet.name)
        wallet.save(update_fields=["name"])
        return success_response(data=WalletSerializer(wallet).data, message="Wallet updated")


class WalletCredentialListView(APIView):
    permission_classes = [IsHolder]

    def get(self, request):
        wallet = WalletService.get_or_create(request.user)
        held = wallet.held_credentials.select_related("credential").all()
        return success_response(data=HeldCredentialSerializer(held, many=True).data)

    def post(self, request):
        credential_id = request.data.get("credential_id")
        if not credential_id:
            return error_response(errors="credential_id is required")
        try:
            cred = Credential.objects.get(id=credential_id, holder=request.user)
            wallet = WalletService.get_or_create(request.user)
            hc = WalletService.add_credential(wallet, cred)
            return success_response(data=HeldCredentialSerializer(hc).data, status_code=201)
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)


class WalletCredentialDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request, pk):
        wallet = WalletService.get_or_create(request.user)
        hc = wallet.held_credentials.select_related("credential").filter(id=pk).first()
        if not hc:
            return error_response(errors="Held credential not found", status_code=404)
        return success_response(data=HeldCredentialSerializer(hc).data)

    def delete(self, request, pk):
        wallet = WalletService.get_or_create(request.user)
        WalletService.remove_credential(wallet, pk)
        return success_response(message="Removed from wallet")
