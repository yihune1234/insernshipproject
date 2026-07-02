import base58

from apps.did.models import DIDDocument, DIDKey
from apps.did.utils.crypto import generate_keypair
from apps.did.utils.key_storage import encrypt_private_key


class DIDService:
    @classmethod
    def create_for_user(cls, user):
        private_bytes, public_bytes = generate_keypair()
        did_string = "did:key:z" + base58.b58encode(public_bytes).decode()
        document = {
            "@context": ["https://www.w3.org/ns/did/v1"],
            "id": did_string,
            "verificationMethod": [
                {
                    "id": f"{did_string}#key-1",
                    "type": "Ed25519VerificationKey2020",
                    "controller": did_string,
                    "publicKeyMultibase": "z" + base58.b58encode(public_bytes).decode(),
                }
            ],
            "authentication": [f"{did_string}#key-1"],
            "assertionMethod": [f"{did_string}#key-1"],
        }
        did_doc = DIDDocument.objects.create(did=did_string, owner=user, document=document)
        DIDKey.objects.create(
            did_document=did_doc,
            public_key_hex=public_bytes.hex(),
            encrypted_private_key=encrypt_private_key(private_bytes.hex()),
            purpose="authentication",
        )
        DIDKey.objects.create(
            did_document=did_doc,
            public_key_hex=public_bytes.hex(),
            encrypted_private_key=encrypt_private_key(private_bytes.hex()),
            purpose="assertionMethod",
        )
        return did_doc
