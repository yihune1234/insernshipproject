from apps.credentials.services import CredentialService
from apps.holder.models import HeldCredential, Wallet


class WalletService:
    @classmethod
    def get_or_create(cls, user):
        wallet, _ = Wallet.objects.get_or_create(holder=user)
        return wallet

    @classmethod
    def add_credential(cls, wallet, credential):
        hc, _ = HeldCredential.objects.get_or_create(wallet=wallet, credential=credential)
        return hc

    @classmethod
    def remove_credential(cls, wallet, credential_id):
        HeldCredential.objects.filter(wallet=wallet, credential_id=credential_id).delete()

    @classmethod
    def get_credentials(cls, user, status=None, updated_since=None):
        return CredentialService.get_for_holder(user, status=status, updated_since=updated_since)
