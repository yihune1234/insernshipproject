from apps.did.models import DIDDocument


class DIDNotFoundException(Exception):
    pass


class DIDResolver:
    @classmethod
    def resolve(cls, did: str):
        try:
            doc = DIDDocument.objects.get(did=did, status="active")
            return doc.document
        except DIDDocument.DoesNotExist:
            raise DIDNotFoundException(f"DID not found: {did}")
