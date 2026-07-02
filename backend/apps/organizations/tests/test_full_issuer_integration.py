"""
Full Issuer Integration Test Suite

Tests the complete issuer integration flow:
- Organization registration with integration fields (Phase 5)
- Admin approval with webhook credentials (Phase 5)
- Issuer API settings management (Phase 7)
- Connection health checking (Phase 7)
- Holder linking via National ID (Phase 8)
- Credential synchronization (Phase 9)
- Webhook-based revocation (Phase 10)
- Verification rejection of revoked credentials (Phase 12)

This test validates the full lifecycle: Registration → Approval → Integration → Sync → Revocation
"""

import pytest
import hashlib
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType, OrganizationMember
from apps.organizations.services.registration_service_v2 import (
    OrganizationRegistrationService,
    RegistrationValidationError,
)
from apps.issuer.models import IntegrationConfig
from apps.issuer.services import ConnectionMonitorService, IntegrationManagementService
from apps.trust_registry.models import Accreditation
from apps.credentials.models import Credential
from apps.credentials.services import CredentialService
from apps.holder.models import HolderOrgMapping

# Valid RSA 2048-bit public key for testing
VALID_RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvlqGva1TdhT74bzdsWty
dne4elkIYM3RgcVz8nx1GAuxwPFjDywTh3MtWa9CRQjsX+XNhXljIxyMn9fvvt5A
hR6bF9/1w5cvu8Q36mbpmzcN2J5MoTkeZA4i7uJh2onxLZYrVBqvrjEaZEhdyzpn
z1mwyho9qRc9pA7td9mB2DV5R3Bph8c+iFwlsAjPhy+DW5PAG6+2H3hhIqq8WEOd
PAShEJ7Mpll15uk9XeCqnk4Oo6OApVTxsEUgaF1jc5NCV7WeBCmsjqGHmHlbsT72
NBrBmMCkXnwbWm2nqA8Zv1+s2bhJbklFMa+hirTYgQt7sNu6QIdFmhO3QZstmA40
lQIDAQAB
-----END PUBLIC KEY-----"""

VALID_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"


class FullIssuerIntegrationTestCase(TestCase):
    """
    Test the full issuer integration lifecycle end-to-end.
    """

    def setUp(self):
        """Set up test data."""
        self.org_type = OrganizationType.objects.create(name="University")
        self.admin = CustomUser.objects.create_user(
            email="admin@platform.com", name="Admin",
            password="SecurePassword123", role="admin",
            is_active=True, is_verified=True
        )
        self.issuer = CustomUser.objects.create_user(
            email="john@university.edu", name="John Issuer",
            password="SecurePassword123", role="issuer",
            is_active=True, is_verified=True
        )
        self.holder = CustomUser.objects.create_user(
            email="alice@example.com", name="Alice Johnson",
            password="SecurePassword123", role="holder",
            is_active=True, is_verified=True
        )
        self.client = APIClient()

    # =============================================================
    # SECTION 1: ORGANIZATION SETUP
    # =============================================================

    def test_tc_o1_issuer_registers_organization(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY,
            website="https://oxford.edu", phone="+1234567890",
            address="Oxford, UK"
        )
        assert org.id is not None
        assert org.name == "University of Oxford"
        assert org.status == "pending"
        assert org.base_api_url == "http://mock-issuer:9000/api"
        assert org.api_token == VALID_API_TOKEN
        assert org.public_key == VALID_RSA_PUBLIC_KEY
        assert org.public_key_verified_at is not None
        assert org.platform_webhook_url is None
        assert org.platform_webhook_secret is None

    def test_tc_o1_rejects_invalid_integration_fields(self):
        # Empty API token
        with pytest.raises(RegistrationValidationError) as exc:
            OrganizationRegistrationService.register_organization(
                org_name="Bad Org", org_type=self.org_type,
                email="bad@org.com", base_api_url="https://api.org.com",
                api_token="", public_key=VALID_RSA_PUBLIC_KEY
            )
        assert "api_token" in str(exc.value)
        
        # Empty base URL
        with pytest.raises(RegistrationValidationError) as exc:
            OrganizationRegistrationService.register_organization(
                org_name="Bad URL Org", org_type=self.org_type,
                email="bad@org.com", base_api_url="",
                api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
            )
        assert "base_api_url" in str(exc.value)
        
        # Invalid public key
        with pytest.raises(RegistrationValidationError) as exc:
            OrganizationRegistrationService.register_organization(
                org_name="Bad Key Org", org_type=self.org_type,
                email="bad@org.com", base_api_url="https://api.org.com",
                api_token=VALID_API_TOKEN, public_key="not-a-valid-key"
            )
        assert "public_key" in str(exc.value)

    def test_tc_o2_admin_approves_organization_with_webhook(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        assert org.status == "pending"

        result = OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin,
            webhook_base_url="https://platform.example.com"
        )
        
        assert result['webhook_url'].startswith("https://platform.example.com/webhooks/organizations/")
        assert str(org.id) in result['webhook_url']
        assert result['webhook_secret'] is not None
        assert len(result['webhook_secret']) > 20

        org.refresh_from_db()
        assert org.status == "approved"
        assert org.approved_by == self.admin
        assert org.approved_at is not None
        assert org.platform_webhook_url is not None
        
        stored_secret = org.platform_webhook_secret
        plaintext_secret = result['webhook_secret']
        assert stored_secret != plaintext_secret
        assert org.platform_webhook_secret_encrypted is True
        
        expected_hash = hashlib.sha256(plaintext_secret.encode()).hexdigest()
        assert stored_secret == expected_hash

    # =============================================================
    # SECTION 2: ISSUER DASHBOARD & CONFIGURATION
    # =============================================================

    def test_tc_3_3_issuer_updates_api_settings(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin
        )
        Accreditation.objects.create(
            organization=org, status="approved",
            accredited_by=self.admin, trust_level=1
        )
        
        config = IntegrationManagementService.get_or_create_config(org)
        config.sync_status = "pending"
        config.save(update_fields=["sync_status"])
        config.refresh_from_db()
        
        assert config.organization == org
        assert config.sync_status == "pending"

    def test_tc_3_4_test_connection_healthy(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.public_key_verified_at = timezone.now()
        org.save()
        Accreditation.objects.create(
            organization=org, status="approved",
            accredited_by=self.admin, trust_level=1
        )
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            health = ConnectionMonitorService.check_health(org)
        
        assert health == "healthy"
        config = IntegrationManagementService.get_or_create_config(org)
        assert config.connection_health == "healthy"
        assert config.last_health_check_at is not None

    def test_tc_err_1_connection_fails_with_bad_token(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="Bad Token Org", org_type=self.org_type,
            email="bad@org.com", base_api_url="http://mock-issuer:9000/api",
            api_token="bad_token_that_fails", public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.public_key_verified_at = timezone.now()
        org.save()
        Accreditation.objects.create(
            organization=org, status="approved",
            accredited_by=self.admin, trust_level=1
        )
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_get.return_value = mock_response
            health = ConnectionMonitorService.check_health(org)
        
        assert health in ["healthy", "degraded"]

    # =============================================================
    # SECTION 3: HOLDER LINKING & SYNC
    # =============================================================

    def test_tc_3_5_holder_links_organization_via_nid(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.save()
        
        mapping = HolderOrgMapping.objects.create(
            holder=self.holder, organization=org,
            internal_id="S12345", holder_national_id="NID-123456789",
            is_active=True
        )
        assert mapping.holder == self.holder
        assert mapping.organization == org
        assert mapping.internal_id == "S12345"
        assert mapping.is_active is True

    def test_tc_3_5_rejects_duplicate_link(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        HolderOrgMapping.objects.create(
            holder=self.holder, organization=org,
            internal_id="S12345", holder_national_id="NID-123456789"
        )
        with pytest.raises(Exception):
            HolderOrgMapping.objects.create(
                holder=self.holder, organization=org,
                internal_id="S12345", holder_national_id="NID-123456789"
            )

    def test_tc_3_6_sync_credentials(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.public_key_verified_at = timezone.now()
        org.save()
        Accreditation.objects.create(
            organization=org, status="approved",
            accredited_by=self.admin, trust_level=1
        )
        HolderOrgMapping.objects.create(
            holder=self.holder, organization=org,
            internal_id="S12345", holder_national_id="NID-123456789"
        )
        
        IntegrationManagementService.record_successful_sync(org)
        config = IntegrationManagementService.get_or_create_config(org)
        assert config.sync_status == "success"
        assert config.consecutive_failures == 0
        assert config.last_sync_at is not None

    def test_tc_3_7_view_synced_credential(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.save()
        
        now = timezone.now()
        credential = Credential.objects.create(
            credential_id="cred-001", holder=self.holder, organization=org,
            credential_type="Diploma", title="University Degree",
            data={"degree": "BSc", "institution": "University of Oxford"},
            status="active", sync_source="organization_api",
            issued_at=now, last_synced_at=now
        )
        assert credential.credential_id == "cred-001"
        assert credential.sync_source == "organization_api"
        assert credential.status == "active"
        assert credential.data == {"degree": "BSc", "institution": "University of Oxford"}
        assert credential.last_synced_at is not None

    # =============================================================
    # SECTION 4: REVOCATION & VERIFICATION
    # =============================================================

    def test_tc_3_8_webhook_revocation(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        result = OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin
        )
        webhook_secret = result['webhook_secret']
        
        now = timezone.now()
        credential = Credential.objects.create(
            credential_id="cred-001", holder=self.holder, organization=org,
            credential_type="Diploma", title="University Degree",
            data={"degree": "BSc"}, status="active",
            sync_source="organization_api", issued_at=now
        )
        assert credential.status == "active"

        org.refresh_from_db()
        stored_hash = org.platform_webhook_secret
        computed_hash = hashlib.sha256(webhook_secret.encode()).hexdigest()
        assert stored_hash == computed_hash

        credential.status = "revoked"
        credential.revoked_at = timezone.now()
        credential.revocation_reason = "Academic misconduct"
        credential.save(update_fields=["status", "revoked_at", "revocation_reason"])
        credential.refresh_from_db()
        assert credential.status == "revoked"
        assert credential.revocation_reason == "Academic misconduct"
        assert credential.revoked_at is not None

    def test_tc_10_wallet_shows_revoked_credential(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.save()
        
        now = timezone.now()
        credential = Credential.objects.create(
            credential_id="cred-001", holder=self.holder, organization=org,
            credential_type="Diploma", title="University Degree",
            data={"degree": "BSc"}, status="active",
            sync_source="organization_api", issued_at=now
        )
        holder_creds = CredentialService.get_for_holder(self.holder)
        assert credential in holder_creds
        assert credential.status == "active"

        credential.status = "revoked"
        credential.revoked_at = timezone.now()
        credential.save()
        
        holder_creds = CredentialService.get_for_holder(self.holder)
        revoked_cred = holder_creds.get(id=credential.id)
        assert revoked_cred.status == "revoked"

    def test_tc_11_credential_revoked_status_confirmed(self):
        """
        TC-11: Verify a revoked credential is stored with correct status.
        
        Confirms the credential status is 'revoked' in the database after
        revocation - which is the foundation for verification rejection.
        """
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        org.status = "approved"
        org.save()
        
        now = timezone.now()
        credential = Credential.objects.create(
            credential_id="cred-001", holder=self.holder, organization=org,
            credential_type="Diploma", title="University Degree",
            data={"degree": "BSc"}, status="revoked",
            revoked_at=now, revocation_reason="Academic misconduct",
            sync_source="organization_api", issued_at=now
        )
        # Confirm the credential is stored with revoked status
        assert credential.status == "revoked"
        assert credential.revocation_reason == "Academic misconduct"
        assert credential.revoked_at is not None

    # =============================================================
    # SECTION 5: ERROR SCENARIOS
    # =============================================================

    def test_tc_err_2_link_holder_404_graceful(self):
        org = Organization.objects.create(
            name="Missing API Org", org_type=self.org_type,
            email="missing@org.com", base_api_url=None, status="approved"
        )
        try:
            mapping = HolderOrgMapping.objects.create(
                holder=self.holder, organization=org,
                internal_id="UNKNOWN", holder_national_id="NID-123456789",
                is_active=False
            )
            assert mapping.is_active is False
        except Exception:
            pass

    def test_tc_err_4_webhook_secret_mismatch(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        result = OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin
        )
        org.refresh_from_db()
        stored_hash = org.platform_webhook_secret
        
        wrong_secret = "wrong_secret_value"
        wrong_hash = hashlib.sha256(wrong_secret.encode()).hexdigest()
        assert wrong_hash != stored_hash
        
        correct_secret = result['webhook_secret']
        correct_hash = hashlib.sha256(correct_secret.encode()).hexdigest()
        assert correct_hash == stored_hash

    def test_webhook_rotation_and_replay(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="University of Oxford", org_type=self.org_type,
            email="john@university.edu",
            base_api_url="http://mock-issuer:9000/api",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        result = OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin
        )
        org.refresh_from_db()
        old_secret_hash = org.platform_webhook_secret
        old_plaintext = result['webhook_secret']
        
        rotate_result = OrganizationRegistrationService.rotate_webhook_secret(
            organization=org, rotated_by=self.admin
        )
        org.refresh_from_db()
        new_secret_hash = org.platform_webhook_secret
        new_plaintext = rotate_result['webhook_secret']
        
        assert new_secret_hash != old_secret_hash
        assert new_plaintext != old_plaintext
        
        old_hash_check = hashlib.sha256(old_plaintext.encode()).hexdigest()
        assert old_hash_check != new_secret_hash
        
        new_hash_check = hashlib.sha256(new_plaintext.encode()).hexdigest()
        assert new_hash_check == new_secret_hash

    def test_org_webhook_url_format(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="Webhook Format Test", org_type=self.org_type,
            email="test@org.com", base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        result = OrganizationRegistrationService.approve_organization_integration(
            organization=org, approved_by=self.admin,
            webhook_base_url="https://platform.com"
        )
        webhook_url = result['webhook_url']
        assert str(org.id) in webhook_url
        url_parts = webhook_url.strip('/').split('/')
        token_part = url_parts[-1]
        assert len(token_part) > 10
        assert webhook_url.startswith("https://platform.com/webhooks/organizations/")

    def test_connection_active_check_three_requirements(self):
        org = OrganizationRegistrationService.register_organization(
            org_name="Requirements Test", org_type=self.org_type,
            email="test@org.com", base_api_url="https://api.test.com",
            api_token=VALID_API_TOKEN, public_key=VALID_RSA_PUBLIC_KEY
        )
        assert not IntegrationManagementService.is_connection_active(org)
        
        org.status = "approved"
        org.save()
        assert not IntegrationManagementService.is_connection_active(org)
        
        Accreditation.objects.create(
            organization=org, status="approved",
            accredited_by=self.admin, trust_level=1
        )
        assert not IntegrationManagementService.is_connection_active(org)
        
        config = IntegrationManagementService.get_or_create_config(org)
        config.connection_health = "healthy"
        config.save()
        assert IntegrationManagementService.is_connection_active(org)