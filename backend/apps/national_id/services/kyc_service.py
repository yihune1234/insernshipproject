from django.conf import settings


class KYCService:
    @classmethod
    def get_service(cls):
        if settings.USE_FAYDA_SIMULATION:
            from apps.national_id.services.simulation import NationalIDSimulation
            return NationalIDSimulation()
        else:
            from apps.national_id.services.fayda_client import FaydaAPIClient
            return FaydaAPIClient()
