import hashlib
import secrets

from apps.verifier.models import VerifierAPIKey
from apps.verifier.serializers.api_key import CreateAPIKeySerializer, VerifierAPIKeySerializer
from common.api_response import error_response, success_response
from common.permissions import IsVerifier
from rest_framework.views import APIView


class APIKeyListView(APIView):
    permission_classes = [IsVerifier]

    def get(self, request):
        keys = VerifierAPIKey.objects.filter(verifier=request.user, is_active=True)
        return success_response(data=VerifierAPIKeySerializer(keys, many=True).data)

    def post(self, request):
        s = CreateAPIKeySerializer(data=request.data)
        if not s.is_valid():
            return error_response(errors=s.errors)
        raw_key = secrets.token_urlsafe(32)
        prefix = raw_key[:8]
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        api_key = VerifierAPIKey.objects.create(
            verifier=request.user,
            name=s.validated_data["name"],
            key_hash=key_hash,
            prefix=prefix,
        )
        return success_response(
            data={**VerifierAPIKeySerializer(api_key).data, "key": raw_key},
            message="Store this key securely — it won't be shown again",
            status_code=201,
        )


class APIKeyDetailView(APIView):
    permission_classes = [IsVerifier]

    def delete(self, request, pk):
        try:
            key = VerifierAPIKey.objects.get(id=pk, verifier=request.user)
            key.is_active = False
            key.save(update_fields=["is_active"])
            return success_response(message="API key revoked")
        except VerifierAPIKey.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def get(self, request, pk):
        try:
            key = VerifierAPIKey.objects.get(id=pk, verifier=request.user, is_active=True)
            return success_response(data=VerifierAPIKeySerializer(key).data)
        except VerifierAPIKey.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def post(self, request, pk):
        try:
            old_key = VerifierAPIKey.objects.get(id=pk, verifier=request.user)
            old_key.is_active = False
            old_key.save(update_fields=["is_active"])
            raw_key = secrets.token_urlsafe(32)
            new_key = VerifierAPIKey.objects.create(
                verifier=request.user,
                name=old_key.name + " (rotated)",
                key_hash=hashlib.sha256(raw_key.encode()).hexdigest(),
                prefix=raw_key[:8],
            )
            return success_response(
                data={**VerifierAPIKeySerializer(new_key).data, "key": raw_key}
            )
        except VerifierAPIKey.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
