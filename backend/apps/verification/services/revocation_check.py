from apps.verification.services.signature_check import CheckResult


class RevocationCheckService:
    @classmethod
    def run(cls, credential) -> CheckResult:
        if credential.status == "revoked":
            reason = credential.revocation_reason or "No reason provided"
            return CheckResult(
                name="revocation",
                passed=False,
                message=f"Credential revoked: {reason}",
            )
        if credential.status == "suspended":
            return CheckResult(name="revocation", passed=False, message="Credential is suspended")
        return CheckResult(name="revocation", passed=True, message="Credential is not revoked or suspended")
