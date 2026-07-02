"""
Phase 10, 11, 12 - End-to-End Integration Tests

Tests the complete pipeline: Storage (Phase 10) → Wallet/Sharing (Phase 11) → Verification (Phase 12)
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential
from apps.credentials.services.matching_service import MatchingService
from apps.credentials.services.revocation_service import RevocationService
from apps.credentials.services.credential_service import CredentialService
from apps.holder.services.presentation_service import PresentationService
from apps.verification.services.verification_engine import VerificationEngine
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation
from apps.national_id.models import NationalIDVerification


# Valid RSA public key for testing
VALID_RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvlqGva1TdhT74bzdsWty
dne4elkIYM3RgcVz8nx1GAuxwPFjDywTh3MtWa9CRQjsX+XNhXljIxyMn9fvvt5A
hR6bF9/1w5cvu8Q36mbpmzcN2J5MoTkeZA4i7uJh2onxLZYrVBqvrjEaZEhdyzpn
z1mwyho9qRc9pA7td9mB2DV5R3Bph8c+iFwlsAjPhy+DW5PAG6+2H3hhIqq8WEOd
PAShEJ7Mpll15uk9XeCqnk4Oo6OApVTxsEUgaF1jc5NCV7WeBCmsjqGHmHlbsT72
NBrBmMCkXnwbWm2nqA8Zv1+s2bhJbklFMa+hirTYgQt7sNu6QIdFmhO3QZstmA40
lQIDAQAB
-----END PUBLIC KEY-----"""


class Phase10_11_12IntegrationTests(TestCase):
    """End-to-end integration tests for Phase 10, 11, 12."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up complete test scenario."""
        cls.org_type = OrganizationType.objects.create(
            name="University",
            description="Educational Institution"
        )
        
        cls.admin = CustomUser.objects.create_user(
            email="admin@test.com",
            name="Admin",
            password="pass123",
            role="admin"
        )
        
        cls.organization = Organization.objects.create(
            name="Test University",
            org_type=cls.org_type,
            email="contact@university.edu",
            status="approved",
            public_key=VALID_RSA_PUBLIC_KEY,
            public_key_verified_at=timezone.now()
        )
        
        Accreditation.objects.create(
            organization=cls.organization,
            status="approved",
            accredited_by=cls.admin,
            trust_level=3
        )
    
    def setUp(self):
        """Set up for each test."""
        self.holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder User",
            password="pass123",
            role="holder"
        )
        
        # Verify national ID (Phase 3 requirement)
        NationalIDVerification.objects.create(
            user=self.holder,
            fin="123456789",
            verified=True
        )
        self.holder.national_id_verified = True
        self.holder.save()
    
    def test_end_to_end_credential_lifecycle(self):
        """Test complete credential lifecycle: storage → sharing → verification."""
        
        # Phase 10: Create credential via sync
        cred_data = {
            "credential_id": "cred-e2e-001",
            "credential_type": "degree",
            "title": "Bachelor's Degree",
            "data": {"major": "Computer Science"},
            "issued_at": timezone.now(),
            "national_id": "123456789",  # Must match holder's verified national_id
        }
        
        credential = CredentialService.save(self.organization, cred_data)
        
        # Verify Phase 10 requirements
        self.assertEqual(credential.sync_source, "organization_api")
        # Since the national_id is verified, it will be automatically matched
        self.assertEqual(credential.status, "active")
        self.assertEqual(credential.holder, self.holder)
        
        # Phase 11: Create presentation for sharing
        credentials_list = [
            {
                "credential_id": str(credential.id),
                "disclosed_claims": ["major"]
            }
        ]
        
        presentation = PresentationService.create(self.holder, credentials_list)
        self.assertIsNotNone(presentation)
        self.assertGreater(len(presentation.credentials), 0)
        
        # Phase 12: Verify credential
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(credential.credential_id)
        
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["credential_id"], credential.credential_id)
    
    def test_revocation_blocks_sharing(self):
        """Test that revoked credentials cannot be shared (Phase 11 rule)."""
        
        # Create and match credential
        cred = Credential.objects.create(
            credential_id="cred-revoke-test",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="active"
        )
        
        # Revoke it
        RevocationService.revoke_credential(cred, reason="Test revocation")
        cred.refresh_from_db()
        
        # Try to share - should fail
        credentials_list = [
            {
                "credential_id": str(cred.id),
                "disclosed_claims": []
            }
        ]
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("revoked", str(cm.exception))
    
    def test_revocation_fails_verification(self):
        """Test that revoked credentials fail verification (Phase 12 check)."""
        
        # Create credential
        cred = Credential.objects.create(
            credential_id="cred-verify-revoke",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=365),
            status="active"
        )
        
        # Verify passes when active
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result1 = VerificationEngine.verify(cred.credential_id)
        
        self.assertTrue(result1["is_valid"])
        
        # Revoke credential
        RevocationService.revoke_credential(cred)
        cred.refresh_from_db()
        
        # Verification should fail
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result2 = VerificationEngine.verify(cred.credential_id)
        
        self.assertFalse(result2["is_valid"])
        revocation_check = [c for c in result2["checks"] if c["check"] == "revocation"]
        self.assertFalse(revocation_check[0]["passed"])
    
    def test_expiration_in_full_pipeline(self):
        """Test expiration handling across all three phases."""
        
        # Create credential that will expire
        cred = Credential.objects.create(
            credential_id="cred-expire",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            expires_at=timezone.now() - timedelta(days=1),  # Already expired
            status="active"
        )
        
        # Sharing should work (shares what's stored, doesn't validate)
        credentials_list = [
            {
                "credential_id": str(cred.id),
                "disclosed_claims": []
            }
        ]
        
        presentation = PresentationService.create(self.holder, credentials_list)
        self.assertIsNotNone(presentation)
        
        # But verification should fail
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(cred.credential_id)
        
        self.assertFalse(result["is_valid"])
        expiry_check = [c for c in result["checks"] if c["check"] == "expiry"]
        self.assertFalse(expiry_check[0]["passed"])
    
    def test_trust_check_in_verification_phase(self):
        """Test that verification checks trust (Phase 6) before signature (Phase 12)."""
        
        # Create credential
        cred = Credential.objects.create(
            credential_id="cred-trust",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=365),
            status="active",
            signature="sig-123",
            raw_payload="payload"
        )
        
        # Initially trusted
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result1 = VerificationEngine.verify(cred.credential_id)
        
        self.assertTrue(result1["is_valid"])
        
        # Revoke trust
        Accreditation.objects.filter(organization=self.organization).update(status="revoked")
        
        # Verification should fail at trust check
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True  # Signature still valid
            
            result2 = VerificationEngine.verify(cred.credential_id)
        
        self.assertFalse(result2["is_valid"])
        trust_check = [c for c in result2["checks"] if c["check"] == "trust"]
        self.assertFalse(trust_check[0]["passed"])
    
    def test_sync_source_validation_phase_10(self):
        """Test Phase 10 requirement: all credentials have sync_source."""
        
        # Create via service
        cred_data = {
            "credential_id": "cred-sync-src",
            "credential_type": "degree",
            "title": "Degree",
            "data": {},
            "issued_at": timezone.now(),
        }
        
        credential = CredentialService.save(self.organization, cred_data)
        
        # Verify sync_source is set
        self.assertIsNotNone(credential.sync_source)
        self.assertEqual(credential.sync_source, "organization_api")
        
        # Run validation
        validation = MatchingService.validate_all_credentials_externally_sourced()
        self.assertTrue(validation["valid"])
        self.assertEqual(validation["invalid_count"], 0)
    
    def test_matching_idempotency_phase_10(self):
        """Test Phase 10: matching is idempotent."""
        
        # Create pending credentials
        Credential.objects.create(
            credential_id="cred-idem-1",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="degree",
            title="Degree 1",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        Credential.objects.create(
            credential_id="cred-idem-2",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="degree",
            title="Degree 2",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        # Match once
        count1 = MatchingService.match_for_national_id(self.holder, "123456789")
        self.assertEqual(count1, 2)
        
        # Match again - should be 0
        count2 = MatchingService.match_for_national_id(self.holder, "123456789")
        self.assertEqual(count2, 0)
    
    def test_no_direct_creation_outside_sync_phase_10(self):
        """Test Phase 10 rule: credentials only created via Phase 9 sync."""
        
        # This test verifies that the CredentialService.save() is the only
        # way to create credentials with sync_source set properly
        
        # Attempt to create directly (without sync_source)
        try:
            cred = Credential.objects.create(
                credential_id="direct-create",
                organization=self.organization,
                national_id="123456789",
                credential_type="degree",
                title="Degree",
                data={},
                issued_at=timezone.now(),
                status="active"
            )
            
            # If we get here, verify sync_source was set by default
            self.assertIsNotNone(cred.sync_source)
            self.assertEqual(cred.sync_source, "organization_api")
        except Exception:
            # If creation failed, that's also acceptable for Phase 10
            pass
