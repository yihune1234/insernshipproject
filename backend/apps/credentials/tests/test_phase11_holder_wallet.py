"""
Phase 11: Holder Wallet Tests

Tests for wallet retrieval, credential sharing, and revocation checks.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential
from apps.holder.models import Presentation
from apps.holder.services.presentation_service import PresentationService
from apps.organizations.models import Organization, OrganizationType


class Phase11WalletTests(TestCase):
    """Test Phase 11 wallet functionality."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.org_type = OrganizationType.objects.create(
            name="University",
            description="Educational Institution"
        )
        
        cls.organization = Organization.objects.create(
            name="Test University",
            org_type=cls.org_type,
            email="contact@university.edu",
            status="approved"
        )
    
    def setUp(self):
        """Set up for each test."""
        self.holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder User",
            password="pass123",
            role="holder"
        )
        
        self.active_credential = Credential.objects.create(
            credential_id="active-cred",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Bachelor's Degree",
            data={"major": "Computer Science"},
            issued_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=365),
            status="active"
        )
    
    def test_create_presentation_from_active_credential(self):
        """Create presentation from active credential."""
        credentials_list = [
            {
                "credential_id": str(self.active_credential.id),
                "disclosed_claims": ["major"]
            }
        ]
        
        presentation = PresentationService.create(self.holder, credentials_list)
        
        self.assertIsNotNone(presentation)
        self.assertEqual(presentation.holder, self.holder)
        self.assertGreater(len(presentation.credentials), 0)
    
    def test_prevent_revoked_credential_in_presentation(self):
        """Prevent revoked credentials from being included in presentations."""
        # Revoke credential
        self.active_credential.status = "revoked"
        self.active_credential.revoked_at = timezone.now()
        self.active_credential.revocation_reason = "Fraud detected"
        self.active_credential.save()
        
        credentials_list = [
            {
                "credential_id": str(self.active_credential.id),
                "disclosed_claims": ["major"]
            }
        ]
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("revoked", str(cm.exception))
    
    def test_prevent_expired_credential_in_presentation(self):
        """Prevent expired credentials from being included in presentations."""
        # Expire credential
        self.active_credential.status = "expired"
        self.active_credential.expires_at = timezone.now() - timedelta(days=1)
        self.active_credential.save()
        
        credentials_list = [
            {
                "credential_id": str(self.active_credential.id),
                "disclosed_claims": ["major"]
            }
        ]
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("expired", str(cm.exception))
    
    def test_presentation_includes_only_disclosed_claims(self):
        """Presentation includes only requested disclosed claims."""
        # Add full data to credential
        self.active_credential.data = {
            "major": "Computer Science",
            "gpa": "3.8",
            "graduation_date": "2024-06-15"
        }
        self.active_credential.save()
        
        credentials_list = [
            {
                "credential_id": str(self.active_credential.id),
                "disclosed_claims": ["major", "graduation_date"]  # Not GPA
            }
        ]
        
        presentation = PresentationService.create(self.holder, credentials_list)
        
        # Verify only disclosed claims included
        cred_in_pres = presentation.credentials[0]
        self.assertIn("major", cred_in_pres["disclosed"])
        self.assertIn("graduation_date", cred_in_pres["disclosed"])
        self.assertNotIn("gpa", cred_in_pres["disclosed"])
    
    def test_presentation_rejects_nonexistent_credential(self):
        """Presentation rejects non-existent credentials."""
        credentials_list = [
            {
                "credential_id": "99999999-9999-9999-9999-999999999999",
                "disclosed_claims": ["major"]
            }
        ]
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("not found", str(cm.exception).lower())
    
    def test_presentation_rejects_other_holder_credential(self):
        """Presentation rejects credentials owned by other holders."""
        other_holder = CustomUser.objects.create_user(
            email="other@test.com",
            name="Other Holder",
            password="pass123",
            role="holder"
        )
        
        other_credential = Credential.objects.create(
            credential_id="other-cred",
            organization=self.organization,
            national_id="999999999",
            holder=other_holder,
            credential_type="diploma",
            title="Diploma",
            data={},
            issued_at=timezone.now(),
            status="active"
        )
        
        credentials_list = [
            {
                "credential_id": str(other_credential.id),
                "disclosed_claims": []
            }
        ]
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("not found", str(cm.exception).lower())
    
    def test_empty_presentation_rejected(self):
        """Cannot create presentation with no valid credentials."""
        credentials_list = []
        
        with self.assertRaises(ValueError) as cm:
            PresentationService.create(self.holder, credentials_list)
        
        self.assertIn("no valid", str(cm.exception).lower())
    
    def test_presentation_with_multiple_credentials(self):
        """Create presentation with multiple active credentials."""
        cred2 = Credential.objects.create(
            credential_id="cred-2",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="diploma",
            title="Diploma",
            data={"year": "2024"},
            issued_at=timezone.now(),
            status="active"
        )
        
        credentials_list = [
            {
                "credential_id": str(self.active_credential.id),
                "disclosed_claims": ["major"]
            },
            {
                "credential_id": str(cred2.id),
                "disclosed_claims": ["year"]
            }
        ]
        
        presentation = PresentationService.create(self.holder, credentials_list)
        
        self.assertEqual(len(presentation.credentials), 2)
