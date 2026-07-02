from apps.trust_registry.services import TrustService
from apps.verification.services.signature_check import CheckResult


class TrustCheckService:
    @classmethod
    def run(cls, credential) -> CheckResult:
        is_trusted = TrustService.is_trusted(credential.organization)
        if is_trusted:
            return CheckResult(name="trust", passed=True, message="Issuing organization is trusted")
        return CheckResult(
            name="trust",
            passed=False,
            message=f"Organization '{credential.organization.name}' is not accredited",
        )
