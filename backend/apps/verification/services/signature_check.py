from dataclasses import dataclass


@dataclass
class CheckResult:
    name: str
    passed: bool
    message: str


class SignatureCheckService:
    @classmethod
    def run(cls, credential) -> CheckResult:
        org = credential.organization
        if not org.public_key:
            return CheckResult(
                name="signature",
                passed=True,
                message="Signature check skipped: organization has no public key configured",
            )
        if not credential.signature or not credential.raw_payload:
            return CheckResult(
                name="signature",
                passed=True,
                message="Signature check skipped: no signature data on credential",
            )
        from apps.credentials.utils.signature_utils import SignatureUtils
        ok = SignatureUtils.verify(org.public_key, credential.raw_payload, credential.signature)
        if ok:
            return CheckResult(name="signature", passed=True, message="Signature valid")
        return CheckResult(name="signature", passed=False, message="Signature verification failed")
