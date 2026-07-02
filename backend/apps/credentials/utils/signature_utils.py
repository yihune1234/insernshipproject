import json
import logging

from apps.did.utils.crypto import verify_signature

logger = logging.getLogger(__name__)


class SignatureUtils:
    @classmethod
    def verify(cls, public_key_hex: str, raw_payload, signature) -> bool:
        try:
            if isinstance(raw_payload, str):
                raw_payload = raw_payload.encode()
            if isinstance(signature, str):
                signature = bytes.fromhex(signature)
            pub_bytes = bytes.fromhex(public_key_hex)
            return verify_signature(pub_bytes, raw_payload, signature)
        except (ValueError, TypeError, Exception) as e:
            logger.warning("Signature verification error: %s", e)
            return False

    @classmethod
    def extract_signing_payload(cls, data: dict) -> bytes:
        return json.dumps(data, sort_keys=True, separators=(",", ":")).encode()
