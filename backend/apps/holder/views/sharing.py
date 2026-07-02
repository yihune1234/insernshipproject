from apps.credentials.models import Credential
from apps.holder.models import CredentialShare
from apps.holder.serializers import CreateShareSerializer, CredentialShareSerializer
from apps.holder.services import ShareService
from common.api_response import error_response, success_response
from common.permissions import IsHolder
from rest_framework.views import APIView


def _build_share_response(share_url, token):
    return {
        "share_token": token,
        "share_url": share_url,
        "qr_code": share_url,
    }


class ShareListView(APIView):
    permission_classes = [IsHolder]

    def get(self, request):
        shares = CredentialShare.objects.filter(holder=request.user, is_active=True)
        return success_response(data=CredentialShareSerializer(shares, many=True).data)

    def post(self, request):
        s = CreateShareSerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        try:
            cred = Credential.objects.get(id=s.validated_data["credential_id"], holder=request.user)
            share_url, token = ShareService.create(
                credential=cred,
                holder=request.user,
                disclosed_claims=s.validated_data["disclosed_claims"],
                expires_in_hours=s.validated_data["expires_in_hours"],
            )
            return success_response(data=_build_share_response(share_url, token), status_code=201)
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)


class ShareDetailView(APIView):
    permission_classes = [IsHolder]

    def get(self, request, token):
        try:
            share = CredentialShare.objects.get(token=token, holder=request.user)
            return success_response(data=CredentialShareSerializer(share).data)
        except CredentialShare.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def delete(self, request, token):
        ShareService.deactivate(token, request.user)
        return success_response(message="Share deactivated")


class ShareEnableView(APIView):
    """POST /wallet/shares/enable/ — create a shareable link for a credential."""
    permission_classes = [IsHolder]

    def post(self, request):
        credential_id = request.data.get("credential_id")
        disclosed_claims = request.data.get("disclosed_claims", [])
        expires_in_hours = request.data.get("expires_in_hours", 24)
        if not credential_id:
            return error_response(errors={"credential_id": ["This field is required."]})
        try:
            cred = Credential.objects.get(id=credential_id, holder=request.user)
            share_url, token = ShareService.create(
                credential=cred,
                holder=request.user,
                disclosed_claims=disclosed_claims,
                expires_in_hours=expires_in_hours,
            )
            return success_response(data=_build_share_response(share_url, token), status_code=201)
        except Credential.DoesNotExist:
            return error_response(errors="Credential not found", status_code=404)
        except Exception as e:
            return error_response(errors=str(e), status_code=400)


class ShareDisableView(APIView):
    """POST /wallet/shares/disable/ — deactivate sharing for a credential."""
    permission_classes = [IsHolder]

    def post(self, request):
        credential_id = request.data.get("credential_id")
        if not credential_id:
            return error_response(errors={"credential_id": ["This field is required."]})
        deactivated = CredentialShare.objects.filter(
            holder=request.user,
            credential_id=credential_id,
            is_active=True,
        )
        count = deactivated.count()
        deactivated.update(is_active=False)
        return success_response(data={"deactivated": count, "message": "Sharing disabled"})


class ShareStatsView(APIView):
    """GET /wallet/shares/stats/ — return active share count."""
    permission_classes = [IsHolder]

    def get(self, request):
        total = CredentialShare.objects.filter(holder=request.user).count()
        active = CredentialShare.objects.filter(holder=request.user, is_active=True).count()
        return success_response(data={"total": total, "active": active})
