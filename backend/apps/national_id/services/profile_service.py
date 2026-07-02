import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class ProfileService:
    """Look up citizen profile by National ID (FIN)."""

    @classmethod
    def get_profile(cls, fin: str) -> dict | None:
        """
        Return mock citizen profile data for the given FIN.
        In production, this would query the NIDA registry or a national database.
        """
        # For development/testing, return mock profile data
        MOCK_PROFILES = {
            "ET123456789": {
                "full_name": "Abebe Kebede",
                "first_name": "Abebe",
                "last_name": "Kebede",
                "gender": "Male",
                "dob": "1999-04-12",
                "phone": "0912345678",
                "national_id": "ET123456789",
                "nationality": "Ethiopian",
                "region": "Oromia",
                "city": "Adama",
                "address": "Adama, Oromia",
                "photo": "https://i.pravatar.cc/300?u=ET123456789",
            },
            "ET987654321": {
                "full_name": "Tigist Bekele",
                "first_name": "Tigist",
                "last_name": "Bekele",
                "gender": "Female",
                "dob": "2000-08-25",
                "phone": "0945678901",
                "national_id": "ET987654321",
                "nationality": "Ethiopian",
                "region": "Addis Ababa",
                "city": "Addis Ababa",
                "address": "Addis Ababa",
                "photo": "https://i.pravatar.cc/300?u=ET987654321",
            },
        }

        profile = MOCK_PROFILES.get(fin.upper())
        if profile:
            logger.info(f"Profile lookup: fin={fin} -> FOUND")
            return profile

        logger.warning(f"Profile lookup: fin={fin} -> NOT FOUND")
        return None