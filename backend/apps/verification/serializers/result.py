from rest_framework import serializers

from apps.verification.models import VerificationHistory, VerificationResult


class VerificationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationResult
        fields = ["id", "external_credential_id", "is_valid", "checks", "overall_message", "verified_at"]


class VerificationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationHistory
        fields = ["id", "credential_id", "organization_name", "credential_type", "result", "verified_at"]
