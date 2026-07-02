from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


def generate_keypair() -> tuple[bytes, bytes]:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    private_bytes = private_key.private_bytes_raw()
    public_bytes = public_key.public_bytes_raw()
    return private_bytes, public_bytes


def sign_message(private_key_bytes: bytes, message: bytes) -> bytes:
    private_key = Ed25519PrivateKey.from_private_bytes(private_key_bytes)
    return private_key.sign(message)


def verify_signature(public_key_bytes: bytes, message: bytes, signature: bytes) -> bool:
    try:
        public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
        public_key.verify(signature, message)
        return True
    except InvalidSignature:
        return False


if __name__ == "__main__":
    priv, pub = generate_keypair()
    msg = b"test message"
    sig = sign_message(priv, msg)
    result = verify_signature(pub, msg, sig)
    assert result is True, "Verification should pass"
    bad_result = verify_signature(pub, b"wrong message", sig)
    assert bad_result is False, "Verification should fail for wrong message"
    print("All DID crypto tests passed.")
