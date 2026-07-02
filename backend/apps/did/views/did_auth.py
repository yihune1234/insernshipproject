import secrets

from django.core.cache import cache

from apps.accounts.services import TokenService
from apps.did.models import DIDDocument, DIDKey
from apps.did.serializers.did import DIDAuthChallengeSerializer, DIDAuthRespondSerializer
from apps.did.utils.crypto import verify_signature
from apps.did.utils.key_storage import decrypt_private_key
from common.api_response import error_response, success_response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class DIDAuthChallengeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DIDAuthChallengeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        did = serializer.validated_data["did"]
        if not DIDDocument.objects.filter(did=did, status="active").exists():
            return error_response(errors="DID not found", status_code=404)
        challenge = secrets.token_hex(32)
        cache.set(f"did_challenge:{did}", challenge, timeout=300)
        return success_response(data={"challenge": challenge})


class DIDAuthRespondView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DIDAuthRespondSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        did = serializer.validated_data["did"]
        challenge = serializer.validated_data["challenge"]
        signature_hex = serializer.validated_data["signature"]
        stored = cache.get(f"did_challenge:{did}")
        if not stored or stored != challenge:
            return error_response(errors="Invalid or expired challenge", status_code=400)
        try:
            doc = DIDDocument.objects.get(did=did, status="active")
            key = DIDKey.objects.filter(did_document=doc, purpose="authentication", is_active=True).first()
            if not key:
                return error_response(errors="No authentication key", status_code=400)
            pub_bytes = bytes.fromhex(key.public_key_hex)
            sig_bytes = bytes.fromhex(signature_hex)
            if not verify_signature(pub_bytes, challenge.encode(), sig_bytes):
                return error_response(errors="Signature verification failed", status_code=401)
            cache.delete(f"did_challenge:{did}")
            user = doc.owner
            tokens = TokenService.issue_tokens(user)
            return success_response(data={"tokens": tokens})
        except DIDDocument.DoesNotExist:
            return error_response(errors="DID not found", status_code=404)
