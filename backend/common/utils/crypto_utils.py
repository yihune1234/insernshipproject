import base64
import hashlib
import hmac
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


def _get_key() -> bytes:
    return bytes.fromhex(settings.ENCRYPTION_KEY)


def aes_encrypt(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def aes_decrypt(encrypted: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted.encode())
    nonce, ciphertext = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()


def hmac_sign(message: str, key: str = None) -> str:
    k = (key or settings.ENCRYPTION_KEY).encode()
    return hmac.new(k, message.encode(), hashlib.sha256).hexdigest()


def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()
