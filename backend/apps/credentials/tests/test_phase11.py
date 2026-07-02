"""
Phase 11: Credential Revocation - Comprehensive Tests

Tests for credential revocation via webhooks, sync, and expiration.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential
from apps.credentials.services.revocation_service import RevocationService
from apps.organizations.models import Organization, OrganizationType


class Phase11RevocationTests(TestCase):
    """Test Phase 11 credential revocation functionality."""
    
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
        
        self.credential = Credential.objects.create(
            credential_id="cred-123",
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
    
    def test_revoke_credential_immediately(self):
        """Revoke active credential immediately."""
        revoked = RevocationService.revoke_credential(
            self.credential,
            reason="Degree invalidated"
        )
        
        self.assertEqual(revoked.status, "revoked")
        self.assertEqual(revoked.revocation_reason, "Degree invalidated")
        self.assertIsNotNone(revoked.revoked_at)
    
    def test_revoke_via_webhook_notification(self):
        """Revoke credential via webhook notification."""
        revoked = RevocationService.revoke_by_webhook(
            "cred-123",
            reason="Failed integrity check"
        )
        
        self.assertEqual(revoked.status, "revoked")
        self.assertEqual(revoked.revocation_reason, "Failed integrity check")
    
    def test_revoke_webhook_credential_not_found(self):
        """Webhook revocation raises if credential not found."""
        with self.assertRaises(Credential.DoesNotExist):
            RevocationService.revoke_by_webhook("nonexistent-123")
    
    def test_revoke_idempotent(self):
        """Revoking already-revoked credential is idempotent."""
        # First revocation
        RevocationService.revoke_credential(self.credential, reason="First revocation")
        revoked_at_1 = self.credential.revoked_at
        
        # Second revocation
        result = RevocationService.revoke_credential(self.credential, reason="Second revocation")
        revoked_at_2 = result.revoked_at
        
        # revoked_at should not change
        self.assertEqual(revoked_at_1, revoked_at_2)
        self.assertEqual(result.status, "revoked")
    
    def test_mark_credential_as_expired(self):
        """Mark credential as expired when expiration_date passed."""
        # Create expired credential
        expired_cred = Credential.objects.create(
            credential_id="expired-123",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Expired Degree",
            data={},
            issued_at=timezone.now() - timedelta(days=730),
            expires_at=timezone.now() - timedelta(days=1),  # Expired yesterday
            status="active"
        )
        
        result = RevocationService.handle_expiration(expired_cred)
        
        self.assertEqual(result.status, "expired")
    
    def test_unexpired_credential_not_marked(self):
        """Credential not yet expired is not marked expired."""
        # Future expiration
        self.credential.expires_at = timezone.now() + timedelta(days=365)
        self.credential.save()
        
        result = RevocationService.handle_expiration(self.credential)
        
        self.assertEqual(result.status, "active")  # Unchanged
    
    def test_no_expiration_date_never_expires(self):
        """Credential without expiration_date never expires."""
        self.credential.expires_at = None
        self.credential.save()
        
        result = RevocationService.handle_expiration(self.credential)
        
        self.assertEqual(result.status, "active")  # Unchanged
    
    def test_check_and_mark_all_expired(self):
        """Scheduled task checks and marks all expired credentials."""
        # Create mix of expired and active
        expired1 = Credential.objects.create(
            credential_id="exp-1",
            organization=self.organization,
            national_id="111111111",
            holder=self.holder,
            credential_type="degree",
            title="Expired 1",
            data={},
            issued_at=timezone.now(),
            expires_at=timezone.now() - timedelta(days=1),
            status="active"
        )
        
        expired2 = Credential.objects.create(
            credential_id="exp-2",
            organization=self.organization,
            national_id="222222222",
            holder=self.holder,
            credential_type="degree",
            title="Expired 2",
            data={},
            issued_at=timezone.now(),
            expires_at=timezone.now() - timedelta(days=10),
            status="active"
        )
        
        # Keep active
        self.credential.expires_at = timezone.now() + timedelta(days=365)
        self.credential.save()
        
        # Run scheduled check
        result = RevocationService.check_and_mark_expired()
        
        self.assertEqual(result["expired"], 2)
        
        # Verify credentials marked expired
        exp1 = Credential.objects.get(credential_id="exp-1")
        self.assertEqual(exp1.status, "expired")
        
        exp2 = Credential.objects.get(credential_id="exp-2")
        self.assertEqual(exp2.status, "expired")
    
    def test_get_revoked_count(self):
        """Get count of revoked credentials."""
        RevocationService.revoke_credential(self.credential, reason="Test revocation")
        
        # Create another revoked
        Credential.objects.create(
            credential_id="cred-2",
            organization=self.organization,
            national_id="999999999",
            holder=self.holder,
            credential_type="diploma",
            title="Diploma",
            data={},
            issued_at=timezone.now(),
            status="revoked",
            revoked_at=timezone.now(),
            revocation_reason="Test"
        )
        
        count = RevocationService.get_revoked_count()
        self.assertEqual(count, 2)
    
    def test_get_revoked_count_by_organization(self):
        """Get revoked count filtered by organization."""
        RevocationService.revoke_credential(self.credential, reason="Revoked")
        
        # Create second org with revoked credential
        org2 = Organization.objects.create(
            name="Other University",
            org_type=self.org_type,
            email="other@university.edu",
            status="approved"
        )
        
        Credential.objects.create(
            credential_id="cred-other",
            organization=org2,
            national_id="999999999",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="revoked",
            revoked_at=timezone.now()
        )
        
        # Check count for first org only
        count = RevocationService.get_revoked_count(organization=self.organization)
        self.assertEqual(count, 1)
    
    def test_get_expired_count(self):
        """Get count of expired credentials."""
        # Set expiration to the past so it will be marked as expired
        self.credential.expires_at = timezone.now() - timedelta(days=1)
        self.credential.save()
        
        RevocationService.handle_expiration(self.credential)
        
        count = RevocationService.get_expired_count()
        self.assertEqual(count, 1)
    
    def test_revocation_status_details(self):
        """Get detailed revocation status for credential."""
        RevocationService.revoke_credential(
            self.credential,
            reason="Fraud detected"
        )
        
        status = RevocationService.get_revocation_status(self.credential)
        
        self.assertTrue(status["revoked"])
        self.assertEqual(status["reason"], "Fraud detected")
        self.assertIsNotNone(status["revoked_at"])
    
    def test_expiration_status_details(self):
        """Get detailed expiration status for credential."""
        self.credential.expires_at = timezone.now() - timedelta(days=1)
        self.credential.status = "expired"
        self.credential.save()
        
        status = RevocationService.get_revocation_status(self.credential)
        
        self.assertTrue(status["expired"])
        self.assertIsNotNone(status["expired_at"])
    
    def test_active_status_details(self):
        """Get status details for active credential."""
        status = RevocationService.get_revocation_status(self.credential)
        
        self.assertFalse(status["revoked"])
        self.assertFalse(status["expired"])
    
    def test_revocation_source_tracking(self):
        """Track source of revocation (webhook, sync, etc)."""
        # Revoke via webhook
        RevocationService.revoke_credential(self.credential, source="webhook")
        
        # Verify reason includes source
        self.assertIn("webhook", self.credential.revocation_reason)
    
    def test_concurrent_revocation_handled(self):
        """Concurrent revocation attempts handled safely."""
        cred1 = RevocationService.revoke_credential(self.credential, reason="First")
        
        # Simulate another process trying to revoke
        cred2 = RevocationService.revoke_credential(self.credential, reason="Second")
        
        # Both should complete without error
        self.assertEqual(cred1.status, "revoked")
        self.assertEqual(cred2.status, "revoked")
