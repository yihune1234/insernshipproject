import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


def _get_key() -> bytes:
    return bytes.fromhex(settings.ENCRYPTION_KEY)


def encrypt_value(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_value(encrypted: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted.encode())
    nonce, ct = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()


encrypt_private_key = encrypt_value
decrypt_private_key = decrypt_value
