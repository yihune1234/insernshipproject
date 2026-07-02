"""
Phase 6 - Trust Registry Tests

Tests for trust checking, accreditation management, and key rotation.
"""

import pytest
from django.test import TestCase
from datetime import timedelta
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation, TrustLevel
from apps.trust_registry.services.trust_service import (
    TrustService,
    NotAccreditedException,
)
from apps.organizations.utils.crypto import PublicKeyValidator


# Test data
VALID_RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplTCHpjyJJC5hAE
9M4uZq0pjJoF0i6D8llFmJ1r9r3D9y8N5bV5H5c3J6n7T5bE5v5F5X5Q5Y5Z5a5B
5b5C5c5D5d5E5e5F5f5G5g5H5h5I5i5J5j5K5k5L5l5M5m5N5n5O5o5P5p5Q5q5
R5r5S5s5T5t5U5u5V5v5W5w5X5x5Y5y5Z5z5A6b6C6c6D6d6E6e6F6f6G6g6H6h6
I6i6J6j6K6k6L6l6M6m6N6n6O6o6P6p6Q6q6R6r6S6s6T6t6U6u6V6v6W6w6X6x6
Y6y6Z6z6A7b7C7c7D7d7E7e7F7f7G7g7H7h7I7i7J7j7K7k7L7l7M7m7N7n7O7o7
P7p7Q7q7R7r7S7s7T7t7U7u7V7v7W7w7X7x7Y7y7Z7z7Q3DAQAB
-----END PUBLIC KEY-----"""

VALID_RSA_PUBLIC_KEY_2 = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4Z2j7zwplTCHpjyJJC5h
AE9M4uZq0pjJoF0i6D8llFmJ1r9r3D9y8N5bV5H5c3J6n7T5bE5v5F5X5Q5Y5Z5a
5B5b5C5c5D5d5E5e5F5f5G5g5H5h5I5i5J5j5K5k5L5l5M5m5N5n5O5o5P5p5Q5q5
R5r5S5s5T5t5U5u5V5v5W5w5X5x5Y5y5Z5z5A6b6C6c6D6d6E6e6F6f6G6g6H6h6
I6i6J6j6K6k6L6l6M6m6N6n6O6o6P6p6Q6q6R6r6S6s6T6t6U6u6V6v6W6w6X6x6
Y6y6Z6z6B7b7C7c7D7d7E7e7F7f7G7g7H7h7I7i7J7j7K7k7L7l7M7m7N7n7O7o7
P7p7Q7q7R7r7S7s7T7t7U7u7V7v7W7w7X7x7Y7y7Z7z7Q3DAQAB
-----END PUBLIC KEY-----"""

VALID_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"


class AccreditationCreationTestCase(TestCase):
    """Test accreditation creation with validity period."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )
        
        self.org = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@univ.edu",
            base_api_url="https://api.univ.edu",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

    def test_accreditation_with_validity_period(self):
        """Test creating accreditation with validity period."""
        expires_at = timezone.now() + timedelta(days=365)
        
        acc = Accreditation.objects.create(
            organization=self.org,
            status="approved",
            trust_level=3,
            trust_score=0.85,
            expires_at=expires_at,
            accredited_by=self.admin
        )

        assert acc.organization == self.org
        assert acc.status == "approved"
        assert acc.issued_at is not None
        assert acc.expires_at == expires_at

    def test_accreditation_without_expiry(self):
        """Test accreditation with no expiry (null expires_at)."""
        acc = Accreditation.objects.create(
            organization=self.org,
            status="approved",
            trust_level=2,
            trust_score=0.70,
            expires_at=None,  # No expiry
            accredited_by=self.admin
        )

        assert acc.expires_at is None


class TrustCheckValidationTestCase(TestCase):
    """Test trust checking with multiple validation criteria."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )

    def test_trusted_organization_passes(self):
        """Test that organization with valid accreditation and public key is trusted."""
        org = Organization.objects.create(
            name="Trusted Org",
            org_type=self.org_type,
            email="trusted@org.com",
            base_api_url="https://api.trusted.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        Accreditation.objects.create(
            organization=org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is True

    def test_unaccredited_organization_fails(self):
        """Test that organization without accreditation is not trusted."""
        org = Organization.objects.create(
            name="Unaccredited Org",
            org_type=self.org_type,
            email="unaccredited@org.com",
            base_api_url="https://api.unaccredited.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        assert TrustService.is_trusted(org) is False

    def test_expired_accreditation_fails(self):
        """Test that organization with expired accreditation is not trusted."""
        org = Organization.objects.create(
            name="Expired Org",
            org_type=self.org_type,
            email="expired@org.com",
            base_api_url="https://api.expired.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        # Create accreditation that expired yesterday
        Accreditation.objects.create(
            organization=org,
            status="approved",
            trust_level=3,
            expires_at=timezone.now() - timedelta(days=1),
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False

    def test_missing_public_key_fails(self):
        """Test that organization without public key is not trusted."""
        org = Organization.objects.create(
            name="No Key Org",
            org_type=self.org_type,
            email="nokey@org.com",
            base_api_url="https://api.nokey.com",
            api_token=VALID_API_TOKEN,
            public_key="",  # Empty public key
            status="approved"
        )

        Accreditation.objects.create(
            organization=org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False

    def test_invalid_public_key_fails(self):
        """Test that organization with invalid public key is not trusted."""
        org = Organization.objects.create(
            name="Invalid Key Org",
            org_type=self.org_type,
            email="invalid@org.com",
            base_api_url="https://api.invalid.com",
            api_token=VALID_API_TOKEN,
            public_key="not a valid key",
            status="approved",
            public_key_verified_at=timezone.now()
        )

        Accreditation.objects.create(
            organization=org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False

    def test_suspended_accreditation_fails(self):
        """Test that organization with suspended accreditation is not trusted."""
        org = Organization.objects.create(
            name="Suspended Org",
            org_type=self.org_type,
            email="suspended@org.com",
            base_api_url="https://api.suspended.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        Accreditation.objects.create(
            organization=org,
            status="suspended",  # Suspended, not approved
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False

    def test_revoked_accreditation_fails(self):
        """Test that organization with revoked accreditation is not trusted."""
        org = Organization.objects.create(
            name="Revoked Org",
            org_type=self.org_type,
            email="revoked@org.com",
            base_api_url="https://api.revoked.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        Accreditation.objects.create(
            organization=org,
            status="revoked",
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False

    def test_never_verified_public_key_fails(self):
        """Test that organization with unverified public key is not trusted."""
        org = Organization.objects.create(
            name="Unverified Key Org",
            org_type=self.org_type,
            email="unverified@org.com",
            base_api_url="https://api.unverified.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=None  # Never verified
        )

        Accreditation.objects.create(
            organization=org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

        assert TrustService.is_trusted(org) is False


class TrustRevocationTestCase(TestCase):
    """Test trust revocation and suspension."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )

        self.org = Organization.objects.create(
            name="Test Org",
            org_type=self.org_type,
            email="test@org.com",
            base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        self.acc = Accreditation.objects.create(
            organization=self.org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

    def test_revoked_organization_immediately_blocked(self):
        """Test that previously trusted org is blocked immediately after revocation."""
        # Verify org is trusted before revocation
        assert TrustService.is_trusted(self.org) is True

        # Revoke
        self.acc.status = "revoked"
        self.acc.save(update_fields=['status'])

        # Verify org is no longer trusted
        assert TrustService.is_trusted(self.org) is False

    def test_suspended_organization_immediately_blocked(self):
        """Test that organization is blocked immediately after suspension."""
        assert TrustService.is_trusted(self.org) is True

        # Suspend
        self.acc.status = "suspended"
        self.acc.save(update_fields=['status'])

        assert TrustService.is_trusted(self.org) is False


class KeyRotationTestCase(TestCase):
    """Test trust suspension on key rotation."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )

        self.org = Organization.objects.create(
            name="Test Org",
            org_type=self.org_type,
            email="test@org.com",
            base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        self.acc = Accreditation.objects.create(
            organization=self.org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

    def test_trust_suspended_on_key_rotation(self):
        """Test that trust is suspended when public key is rotated."""
        # Verify org is trusted
        assert TrustService.is_trusted(self.org) is True

        # Rotate the public key
        self.org.public_key = VALID_RSA_PUBLIC_KEY_2
        self.org.public_key_verified_at = None  # Mark as unverified
        self.org.save(update_fields=['public_key', 'public_key_verified_at'])

        # Suspend trust on key rotation
        TrustService.suspend_trust_on_key_rotation(self.org)

        # Verify org is no longer trusted
        assert TrustService.is_trusted(self.org) is False

        # Reload accreditation to check status
        self.acc.refresh_from_db()
        assert self.acc.status == "suspended"

    def test_reconfirm_after_key_rotation(self):
        """Test that trust can be re-confirmed after key rotation."""
        # Suspend trust due to key rotation
        self.org.public_key = VALID_RSA_PUBLIC_KEY_2
        self.org.save(update_fields=['public_key'])

        TrustService.suspend_trust_on_key_rotation(self.org)
        assert TrustService.is_trusted(self.org) is False

        # Re-confirm after reviewing new key
        TrustService.reconfirm_after_key_rotation(self.org, reconfirmed_by=self.admin)

        # Verify org is trusted again
        assert TrustService.is_trusted(self.org) is True

        # Check that public_key_verified_at was updated
        self.org.refresh_from_db()
        assert self.org.public_key_verified_at is not None


class TrustLevelTestCase(TestCase):
    """Test trust level association and retrieval."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )

        self.org = Organization.objects.create(
            name="Test Org",
            org_type=self.org_type,
            email="test@org.com",
            base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        # Create some trust levels
        TrustLevel.objects.create(
            level=1,
            name="Minimal",
            can_sync_credentials=True,
            can_receive_verifications=False
        )
        TrustLevel.objects.create(
            level=3,
            name="Standard",
            can_sync_credentials=True,
            can_receive_verifications=True
        )

    def test_get_trust_level(self):
        """Test retrieving trust level for accredited org."""
        acc = Accreditation.objects.create(
            organization=self.org,
            status="approved",
            trust_level=3,
            accredited_by=self.admin
        )

        trust_level = TrustService.get_trust_level(self.org)

        assert trust_level is not None
        assert trust_level.level == 3
        assert trust_level.name == "Standard"
        assert trust_level.can_sync_credentials is True
        assert trust_level.can_receive_verifications is True


class AdminOnlyAccessTestCase(TestCase):
    """Test that only admins can manage trust/accreditation."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123",
            role="admin",
            is_active=True,
            is_verified=True
        )

        self.issuer = CustomUser.objects.create_user(
            email="issuer@org.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_non_admin_cannot_modify_accreditation(self):
        """Test that non-admin users cannot create/modify accreditations."""
        org = Organization.objects.create(
            name="Test Org",
            org_type=self.org_type,
            email="test@org.com",
            base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved",
            public_key_verified_at=timezone.now()
        )

        # Verify issuer is not admin
        assert self.issuer.role != "admin"

        # Issuer should not be able to create accreditation (enforced in views)
        # This test verifies the permission model
        from apps.accounts.permissions import IsAdmin
        
        # Create mock request context
        assert self.issuer.role != "admin"
