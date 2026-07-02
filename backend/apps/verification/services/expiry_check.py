from django.utils import timezone

from apps.verification.services.signature_check import CheckResult


class ExpiryCheckService:
    @classmethod
    def run(cls, credential) -> CheckResult:
        if credential.expires_at is None:
            return CheckResult(name="expiry", passed=True, message="No expiry date set")
        if credential.expires_at < timezone.now():
            return CheckResult(
                name="expiry",
                passed=False,
                message=f"Credential expired on {credential.expires_at.isoformat()}",
            )
        return CheckResult(name="expiry", passed=True, message="Credential is not expired")
