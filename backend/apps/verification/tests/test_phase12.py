"""
Phase 12: Credential Verification - Comprehensive Tests

Tests for the complete verification pipeline with all four checks in correct order:
1. Trust check (live, not cached)
2. Signature check
3. Expiration check
4. Revocation check
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation
from apps.verification.services.verification_engine import VerificationEngine
from apps.verification.services.signature_check import SignatureCheckService
from apps.verification.services.trust_check import TrustCheckService
from apps.verification.services.expiry_check import ExpiryCheckService
from apps.verification.services.revocation_check import RevocationCheckService


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


class Phase12VerificationTests(TestCase):
    """Test Phase 12 verification functionality."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
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
    
    def setUp(self):
        """Set up for each test."""
        self.organization = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@university.edu",
            status="approved",
            public_key=VALID_RSA_PUBLIC_KEY,
            public_key_verified_at=timezone.now()
        )
        
        # Create accreditation (trust)
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=3
        )
        
        self.holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder",
            password="pass123",
            role="holder"
        )
        
        self.credential = Credential.objects.create(
            credential_id="cred-123",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Bachelor's Degree",
            data={"major": "Computer Science"},
            issued_at=timezone.now() - timedelta(days=30),
            expires_at=timezone.now() + timedelta(days=365),
            status="active",
            signature="valid-signature",
            signature_algorithm="RS256",
            raw_payload="raw-payload-data"
        )
    
    def test_verification_check_order_trust_first(self):
        """Verification checks trust before signature (Phase 12 requirement)."""
        # Create untrusted organization (remove accreditation)
        self.organization.status = "pending"
        self.organization.save()
        Accreditation.objects.filter(organization=self.organization).delete()
        
        # Verify should fail at trust check
        result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Find trust check in results
        trust_checks = [c for c in result["checks"] if c["check"] == "trust"]
        self.assertTrue(len(trust_checks) > 0)
        self.assertFalse(trust_checks[0]["passed"])
    
    def test_valid_credential_passes_all_checks(self):
        """Valid credential passes all four checks."""
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertTrue(result["is_valid"])
        self.assertIn("All checks passed", result["overall_message"])
        
        # Verify all 4 checks present
        self.assertEqual(len(result["checks"]), 4)
        check_names = [c["check"] for c in result["checks"]]
        self.assertIn("trust", check_names)
        self.assertIn("signature", check_names)
        self.assertIn("expiry", check_names)
        self.assertIn("revocation", check_names)
    
    def test_invalid_signature_fails_verification(self):
        """Invalid signature fails verification."""
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = False
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Find signature check
        sig_checks = [c for c in result["checks"] if c["check"] == "signature"]
        self.assertTrue(len(sig_checks) > 0)
        self.assertFalse(sig_checks[0]["passed"])
    
    def test_untrusted_organization_fails_verification(self):
        """Untrusted organization fails verification even with valid signature."""
        # Revoke accreditation
        Accreditation.objects.filter(organization=self.organization).update(status="revoked")
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Trust check should fail
        trust_checks = [c for c in result["checks"] if c["check"] == "trust"]
        self.assertFalse(trust_checks[0]["passed"])
    
    def test_expired_credential_fails_verification(self):
        """Expired credential fails verification."""
        self.credential.expires_at = timezone.now() - timedelta(days=1)
        self.credential.save()
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Expiry check should fail
        expiry_checks = [c for c in result["checks"] if c["check"] == "expiry"]
        self.assertFalse(expiry_checks[0]["passed"])
    
    def test_revoked_credential_fails_verification(self):
        """Revoked credential fails verification."""
        self.credential.status = "revoked"
        self.credential.revoked_at = timezone.now()
        self.credential.revocation_reason = "Fraud detected"
        self.credential.save()
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Revocation check should fail
        revocation_checks = [c for c in result["checks"] if c["check"] == "revocation"]
        self.assertFalse(revocation_checks[0]["passed"])
    
    def test_multiple_failures_reported(self):
        """Multiple check failures are all reported."""
        # Make credential both revoked and expired
        self.credential.status = "revoked"
        self.credential.revoked_at = timezone.now()
        self.credential.expires_at = timezone.now() - timedelta(days=1)
        self.credential.save()
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = False
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Should report multiple failures
        failed = [c for c in result["checks"] if not c["passed"]]
        self.assertGreater(len(failed), 1)
    
    def test_credential_not_found(self):
        """Verification returns proper error for non-existent credential."""
        result = VerificationEngine.verify("nonexistent-123")
        
        self.assertFalse(result["is_valid"])
        self.assertIn("not found", result["overall_message"].lower())
    
    def test_no_expiration_date_passes_expiry_check(self):
        """Credential with no expiration date passes expiry check."""
        self.credential.expires_at = None
        self.credential.save()
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        # Expiry check should pass
        expiry_checks = [c for c in result["checks"] if c["check"] == "expiry"]
        self.assertTrue(expiry_checks[0]["passed"])
    
    def test_no_signature_skips_signature_check(self):
        """Credential without signature skips signature check (passes)."""
        self.credential.signature = None
        self.credential.raw_payload = None
        self.credential.save()
        
        result = VerificationEngine.verify(self.credential.credential_id)
        
        # Signature check should be skipped (passed)
        sig_checks = [c for c in result["checks"] if c["check"] == "signature"]
        self.assertTrue(sig_checks[0]["passed"])
    
    def test_verification_result_tracking(self):
        """Verification result is tracked in database."""
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        # Verify result was recorded
        from apps.verification.models import VerificationResult
        vr = VerificationResult.objects.filter(external_credential_id=self.credential.credential_id).first()
        
        self.assertIsNotNone(vr)
        self.assertTrue(vr.is_valid)
    
    def test_verification_history_tracked(self):
        """Verification attempt is tracked in history."""
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        # Verify history was recorded
        from apps.verification.models import VerificationHistory
        vh = VerificationHistory.objects.filter(credential_id=self.credential.credential_id).first()
        
        self.assertIsNotNone(vh)
        self.assertTrue(vh.result)
    
    def test_trust_check_live_not_cached(self):
        """Trust check is always live, never cached."""
        # First verification - trusted
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            result1 = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertTrue(result1["is_valid"])
        
        # Make org untrusted
        Accreditation.objects.filter(organization=self.organization).update(status="revoked")
        
        # Second verification - should now fail (proving trust is live-checked)
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            result2 = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result2["is_valid"])
    
    def test_suspended_credential_fails_revocation_check(self):
        """Suspended credential fails revocation check."""
        self.credential.status = "suspended"
        self.credential.save()
        
        with patch('apps.credentials.utils.signature_utils.SignatureUtils.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = VerificationEngine.verify(self.credential.credential_id)
        
        self.assertFalse(result["is_valid"])
        
        # Revocation check should fail for suspended
        revocation_checks = [c for c in result["checks"] if c["check"] == "revocation"]
        self.assertFalse(revocation_checks[0]["passed"])
