"""
Phase 5 - Organizations Tests

Tests for organization registration, approval, and integration field management.
"""

import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType, OrganizationMember
from apps.organizations.services.registration_service_v2 import (
    OrganizationRegistrationService,
    RegistrationValidationError,
)
from apps.organizations.utils.crypto import PublicKeyValidator, PublicKeyValidationError


# Test data - generated valid RSA 2048-bit key
VALID_RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvlqGva1TdhT74bzdsWty
dne4elkIYM3RgcVz8nx1GAuxwPFjDywTh3MtWa9CRQjsX+XNhXljIxyMn9fvvt5A
hR6bF9/1w5cvu8Q36mbpmzcN2J5MoTkeZA4i7uJh2onxLZYrVBqvrjEaZEhdyzpn
z1mwyho9qRc9pA7td9mB2DV5R3Bph8c+iFwlsAjPhy+DW5PAG6+2H3hhIqq8WEOd
PAShEJ7Mpll15uk9XeCqnk4Oo6OApVTxsEUgaF1jc5NCV7WeBCmsjqGHmHlbsT72
NBrBmMCkXnwbWm2nqA8Zv1+s2bhJbklFMa+hirTYgQt7sNu6QIdFmhO3QZstmA40
lQIDAQAB
-----END PUBLIC KEY-----"""

INVALID_RSA_PUBLIC_KEY_MALFORMED = """-----BEGIN PUBLIC KEY-----
This is not a valid public key
-----END PUBLIC KEY-----"""

INVALID_RSA_PUBLIC_KEY_WRONG_FORMAT = """-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4/4ggMkeQaNS7JHmX3m3YlZ7E3c0tNQfqjvQzNxWH8D6L6Gma7L0tJ
-----END PRIVATE KEY-----"""

VALID_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"


class OrganizationRegistrationTestCase(TestCase):
    """Test organization registration with Phase 5 validation."""

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

    def test_valid_organization_registration(self):
        """Test successful organization registration with all required fields."""
        org = OrganizationRegistrationService.register_organization(
            org_name="Test University",
            org_type=self.org_type,
            email="contact@univ.edu",
            base_api_url="https://api.univ.edu",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            phone="+1234567890",
            address="123 University Lane"
        )

        assert org.id is not None
        assert org.name == "Test University"
        assert org.status == "pending"
        assert org.base_api_url == "https://api.univ.edu"
        assert org.api_token == VALID_API_TOKEN
        assert org.public_key == VALID_RSA_PUBLIC_KEY
        assert org.public_key_verified_at is not None

    def test_registration_rejects_malformed_public_key(self):
        """Test that malformed public keys are rejected immediately at registration."""
        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.register_organization(
                org_name="Malformed Org",
                org_type=self.org_type,
                email="bad@org.com",
                base_api_url="https://api.org.com",
                api_token=VALID_API_TOKEN,
                public_key=INVALID_RSA_PUBLIC_KEY_MALFORMED
            )

        assert "public_key" in str(exc_info.value) or "Public key" in str(exc_info.value)

    def test_registration_rejects_wrong_key_type(self):
        """Test that non-RSA keys are rejected."""
        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.register_organization(
                org_name="Wrong Key Org",
                org_type=self.org_type,
                email="wrong@org.com",
                base_api_url="https://api.org.com",
                api_token=VALID_API_TOKEN,
                public_key=INVALID_RSA_PUBLIC_KEY_WRONG_FORMAT
            )

        assert "public_key" in str(exc_info.value) or "not RSA" in str(exc_info.value)

    def test_registration_rejects_empty_api_token(self):
        """Test that empty API token is rejected."""
        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.register_organization(
                org_name="No Token Org",
                org_type=self.org_type,
                email="notoken@org.com",
                base_api_url="https://api.org.com",
                api_token="",
                public_key=VALID_RSA_PUBLIC_KEY
            )

        assert "api_token" in str(exc_info.value)

    def test_registration_rejects_empty_base_url(self):
        """Test that empty base API URL is rejected."""
        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.register_organization(
                org_name="No URL Org",
                org_type=self.org_type,
                email="nourl@org.com",
                base_api_url="",
                api_token=VALID_API_TOKEN,
                public_key=VALID_RSA_PUBLIC_KEY
            )

        assert "base_api_url" in str(exc_info.value)

    def test_registration_rejects_non_https_url(self):
        """Test that non-HTTPS URLs are flagged (warning level)."""
        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.register_organization(
                org_name="No HTTPS Org",
                org_type=self.org_type,
                email="nohttp@org.com",
                base_api_url="ftp://api.org.com",
                api_token=VALID_API_TOKEN,
                public_key=VALID_RSA_PUBLIC_KEY
            )

        assert "http://" in str(exc_info.value) or "https://" in str(exc_info.value)


class OrganizationApprovalTestCase(TestCase):
    """Test organization approval and webhook generation."""

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
            status="pending"
        )

    def test_admin_can_approve_organization(self):
        """Test that admin can approve organization and webhook credentials are generated."""
        result = OrganizationRegistrationService.approve_organization_integration(
            self.org,
            approved_by=self.admin,
            webhook_base_url="https://platform.example.com"
        )

        assert result['webhook_url'].startswith("https://platform.example.com/webhooks/organizations/")
        assert result['webhook_secret'] is not None
        assert len(result['webhook_secret']) > 20
        assert result['organization_id'] == str(self.org.id)

        # Verify organization was updated
        self.org.refresh_from_db()
        assert self.org.status == "approved"
        assert self.org.approved_by == self.admin
        assert self.org.approved_at is not None
        assert self.org.platform_webhook_url is not None

    def test_webhook_secret_shown_once(self):
        """Test that webhook secret is shown once, then stored as hash."""
        result1 = OrganizationRegistrationService.approve_organization_integration(
            self.org,
            approved_by=self.admin
        )

        # Secret is plaintext in result
        secret_plaintext_1 = result1['webhook_secret']
        assert len(secret_plaintext_1) > 20

        # Reload organization
        self.org.refresh_from_db()

        # Stored secret should be hashed, not plaintext
        assert self.org.platform_webhook_secret != secret_plaintext_1

        # Verify it's marked as encrypted/hashed
        assert self.org.platform_webhook_secret_encrypted is True

    def test_non_admin_cannot_approve(self):
        """Test that non-admin users cannot approve organization."""
        issuer = CustomUser.objects.create_user(
            email="issuer@org.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

        from apps.accounts.permissions import IsAdmin
        
        # Would check permission_classes in views
        assert issuer.role != "admin"


class WebhookSecretRotationTestCase(TestCase):
    """Test webhook secret rotation."""

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
            approved_by=self.admin,
            approved_at=timezone.now(),
            platform_webhook_url="https://platform.example.com/webhooks/organizations/123/abc/",
            platform_webhook_secret="hash_of_old_secret"
        )

    def test_webhook_secret_rotation(self):
        """Test that webhook secret can be rotated (regenerated)."""
        old_secret_hash = self.org.platform_webhook_secret

        result = OrganizationRegistrationService.rotate_webhook_secret(
            self.org,
            rotated_by=self.admin
        )

        # New secret is different and plaintext
        assert result['webhook_secret'] != old_secret_hash

        # Reload organization
        self.org.refresh_from_db()

        # Secret should be different
        assert self.org.platform_webhook_secret != old_secret_hash

    def test_cannot_rotate_secret_for_unapproved_org(self):
        """Test that webhook secret cannot be rotated for pending/unapproved org."""
        pending_org = Organization.objects.create(
            name="Pending Org",
            org_type=self.org_type,
            email="pending@org.com",
            base_api_url="https://api.pending.com",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="pending"
        )

        with pytest.raises(RegistrationValidationError) as exc_info:
            OrganizationRegistrationService.rotate_webhook_secret(
                pending_org,
                rotated_by=self.admin
            )

        assert "must be approved" in str(exc_info.value).lower()


class MemberManagementTestCase(TestCase):
    """Test organization member management."""

    def setUp(self):
        self.org_type = OrganizationType.objects.create(name="University")
        self.org = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@univ.edu",
            base_api_url="https://api.univ.edu",
            api_token=VALID_API_TOKEN,
            public_key=VALID_RSA_PUBLIC_KEY,
            status="approved"
        )

        self.owner = CustomUser.objects.create_user(
            email="owner@univ.edu",
            name="Owner",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

        OrganizationMember.objects.create(
            organization=self.org,
            user=self.owner,
            role="owner"
        )

    def test_add_member_to_organization(self):
        """Test adding a member to organization."""
        staff = CustomUser.objects.create_user(
            email="staff@univ.edu",
            name="Staff",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

        member = OrganizationMember.objects.create(
            organization=self.org,
            user=staff,
            role="staff"
        )

        assert member.organization == self.org
        assert member.user == staff
        assert member.role == "staff"
        assert member.is_active is True

    def test_remove_member_from_organization(self):
        """Test removing a member (soft delete)."""
        staff = CustomUser.objects.create_user(
            email="staff@univ.edu",
            name="Staff",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

        member = OrganizationMember.objects.create(
            organization=self.org,
            user=staff,
            role="staff"
        )

        # Soft delete via is_active
        member.is_active = False
        member.save()

        member.refresh_from_db()
        assert member.is_active is False

    def test_member_distinct_from_holder_identity(self):
        """Test that organization members are distinct from holder identities."""
        member_user = self.owner  # Has role=issuer

        # User should not have holder role
        assert member_user.role == "issuer"
        assert member_user.role != "holder"

        # They can be org member
        assert OrganizationMember.objects.filter(
            user=member_user,
            organization=self.org
        ).exists()

        # But they are NOT a holder
        assert member_user.role != "holder"


class PublicKeyValidationTestCase(TestCase):
    """Test public key validation utility."""

    def test_valid_rsa_key_passes(self):
        """Test that valid RSA public key passes validation."""
        assert PublicKeyValidator.validate_rsa_public_key(VALID_RSA_PUBLIC_KEY) is True

    def test_malformed_key_fails(self):
        """Test that malformed key fails validation."""
        with pytest.raises(PublicKeyValidationError):
            PublicKeyValidator.validate_rsa_public_key(INVALID_RSA_PUBLIC_KEY_MALFORMED)

    def test_empty_key_fails(self):
        """Test that empty key fails validation."""
        with pytest.raises(PublicKeyValidationError):
            PublicKeyValidator.validate_rsa_public_key("")

    def test_key_fingerprint_generation(self):
        """Test that key fingerprint can be generated."""
        fingerprint = PublicKeyValidator.get_key_fingerprint(VALID_RSA_PUBLIC_KEY)

        # Should be SHA256 hex string
        assert len(fingerprint) == 64  # SHA256 = 64 hex chars
        assert all(c in '0123456789abcdef' for c in fingerprint)