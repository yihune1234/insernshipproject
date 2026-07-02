import logging

from apps.verification.models import VerificationHistory, VerificationResult
from apps.verification.services.expiry_check import ExpiryCheckService
from apps.verification.services.revocation_check import RevocationCheckService
from apps.verification.services.signature_check import SignatureCheckService
from apps.verification.services.trust_check import TrustCheckService

logger = logging.getLogger(__name__)


class VerificationEngine:
    @classmethod
    def verify(cls, credential_id: str, requesting_user=None) -> dict:
        from apps.credentials.models import Credential

        try:
            credential = Credential.objects.select_related("organization").get(
                credential_id=credential_id
            )
        except Credential.DoesNotExist:
            result = VerificationResult.objects.create(
                external_credential_id=credential_id,
                verifier=requesting_user,
                is_valid=False,
                checks=[{"check": "lookup", "passed": False, "message": "Credential not found"}],
                overall_message="Credential not found",
            )
            return {
                "credential_id": credential_id,
                "is_valid": False,
                "checks": result.checks,
                "overall_message": "Credential not found",
            }

        checks = [
            TrustCheckService.run(credential),
            SignatureCheckService.run(credential),
            ExpiryCheckService.run(credential),
            RevocationCheckService.run(credential),
        ]

        is_valid = all(c.passed for c in checks)
        checks_data = [{"check": c.name, "passed": c.passed, "message": c.message} for c in checks]
        failed = [c for c in checks if not c.passed]
        overall_message = "All checks passed" if is_valid else f"Failed: {', '.join(c.name for c in failed)}"

        vr = VerificationResult.objects.create(
            credential=credential,
            external_credential_id=credential_id,
            verifier=requesting_user,
            is_valid=is_valid,
            checks=checks_data,
            overall_message=overall_message,
        )

        VerificationHistory.objects.create(
            verifier=requesting_user,
            credential_id=credential_id,
            organization_name=credential.organization.name,
            credential_type=credential.credential_type,
            result=is_valid,
        )

        result_data = {
            "credential_id": credential_id,
            "is_valid": is_valid,
            "checks": checks_data,
            "credential_title": credential.title,
            "organization_name": credential.organization.name,
            "holder_national_id": credential.national_id,
            "issued_at": credential.issued_at.isoformat() if credential.issued_at else None,
            "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
            "overall_message": overall_message,
        }
        if not is_valid:
            result_data["failed_checks"] = [
                {"check": c.name, "message": c.message} for c in failed
            ]
        return result_data
