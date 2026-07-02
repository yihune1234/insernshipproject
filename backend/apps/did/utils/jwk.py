import base64


def ed25519_to_jwk(public_key_bytes: bytes, key_id: str = None) -> dict:
    x = base64.urlsafe_b64encode(public_key_bytes).rstrip(b"=").decode()
    jwk = {"kty": "OKP", "crv": "Ed25519", "x": x, "use": "sig"}
    if key_id:
        jwk["kid"] = key_id
    return jwk
