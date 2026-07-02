"""
Phase 10: Credential Storage - Comprehensive Tests

Tests for credential matching, sync_source validation, and storage integrity.
"""

import pytest
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.credentials.models import Credential
from apps.credentials.services.matching_service import MatchingService
from apps.credentials.services.credential_service import CredentialService
from apps.credentials.exceptions import InvalidStatusTransitionException
from apps.national_id.models import NationalIDVerification
from apps.organizations.models import Organization, OrganizationType


class Phase10StorageTests(TestCase):
    """Test Phase 10 credential storage requirements."""
    
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
    
    def test_credential_has_sync_source_field(self):
        """Credential model has sync_source field with default."""
        cred = Credential.objects.create(
            credential_id="cred-123",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Bachelor's Degree",
            data={"major": "Computer Science"},
            issued_at=timezone.now(),
            status="active"
        )
        
        self.assertTrue(hasattr(cred, 'sync_source'))
        self.assertIsNotNone(cred.sync_source)
        self.assertEqual(cred.sync_source, "organization_api")
    
    def test_sync_source_set_on_save_via_service(self):
        """Credential service always sets sync_source to organization_api."""
        data = {
            "credential_id": "cred-456",
            "credential_type": "diploma",
            "title": "Diploma",
            "data": {"field": "value"},
            "issued_at": timezone.now(),
        }
        
        cred = CredentialService.save(self.organization, data)
        
        self.assertEqual(cred.sync_source, "organization_api")
    
    def test_all_credentials_marked_as_externally_sourced(self):
        """Validation confirms all credentials are marked as externally sourced."""
        # Create multiple credentials
        for i in range(3):
            Credential.objects.create(
                credential_id=f"cred-{i}",
                organization=self.organization,
                national_id="123456789",
                holder=self.holder,
                credential_type="degree",
                title="Degree",
                data={},
                issued_at=timezone.now(),
                status="active",
                sync_source="organization_api"
            )
        
        result = MatchingService.validate_all_credentials_externally_sourced()
        
        self.assertTrue(result["valid"])
        self.assertEqual(result["invalid_count"], 0)
    
    def test_status_field_required_choices(self):
        """Credential status field has required choices."""
        self.assertIn("active", [choice[0] for choice in Credential.STATUS_CHOICES])
        self.assertIn("revoked", [choice[0] for choice in Credential.STATUS_CHOICES])
        self.assertIn("suspended", [choice[0] for choice in Credential.STATUS_CHOICES])
        self.assertIn("expired", [choice[0] for choice in Credential.STATUS_CHOICES])
        self.assertIn("pending_match", [choice[0] for choice in Credential.STATUS_CHOICES])
    
    def test_credential_fields_required(self):
        """All Phase 10 required fields are present."""
        required_fields = [
            'credential_id', 'organization', 'holder', 'national_id',
            'credential_type', 'title', 'data',
            'issued_at', 'expires_at', 'status',
            'signature', 'signature_algorithm',
            'last_synced_at', 'sync_source'
        ]
        
        meta_fields = [f.name for f in Credential._meta.get_fields()]
        
        for field in required_fields:
            self.assertIn(field, meta_fields, f"Required field {field} not in Credential model")


class Phase10MatchingTests(TestCase):
    """Test Phase 10 credential matching functionality."""
    
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
        
        # Mark holder as nationally verified (Phase 3)
        NationalIDVerification.objects.create(
            user=self.holder,
            fin="123456789",
            verified=True
        )
        self.holder.national_id_verified = True
        self.holder.save()
    
    def test_match_pending_credentials_for_holder(self):
        """Matching service matches pending credentials to verified holder."""
        # Create pending credentials
        Credential.objects.create(
            credential_id="cred-1",
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
            credential_id="cred-2",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="diploma",
            title="Diploma",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        # Match credentials
        count = MatchingService.match_for_national_id(self.holder, "123456789")
        
        self.assertEqual(count, 2)
        
        # Verify credentials matched
        cred1 = Credential.objects.get(credential_id="cred-1")
        self.assertEqual(cred1.holder, self.holder)
        self.assertEqual(cred1.status, "active")
        
        cred2 = Credential.objects.get(credential_id="cred-2")
        self.assertEqual(cred2.holder, self.holder)
        self.assertEqual(cred2.status, "active")
    
    def test_no_credentials_to_match_returns_zero(self):
        """Matching returns 0 if no pending credentials exist."""
        count = MatchingService.match_for_national_id(self.holder, "999999999")
        
        self.assertEqual(count, 0)
    
    def test_reject_non_holder_role(self):
        """Matching rejects non-holder roles."""
        admin = CustomUser.objects.create_user(
            email="admin@test.com",
            name="Admin",
            password="pass123",
            role="admin"
        )
        
        with self.assertRaises(ValueError) as cm:
            MatchingService.match_for_national_id(admin, "123456789")
        
        self.assertIn("non-holder role", str(cm.exception))
    
    def test_reject_unverified_holder(self):
        """Matching rejects holders without verified national ID."""
        unverified_holder = CustomUser.objects.create_user(
            email="unverified@test.com",
            name="Unverified Holder",
            password="pass123",
            role="holder"
        )
        unverified_holder.national_id_verified = False
        unverified_holder.save()
        
        with self.assertRaises(ValueError) as cm:
            MatchingService.match_for_national_id(unverified_holder, "123456789")
        
        self.assertIn("verified national ID", str(cm.exception))
    
    def test_rematch_credential_to_different_holder(self):
        """Rematching allows reassigning credential to different holder."""
        holder2 = CustomUser.objects.create_user(
            email="holder2@test.com",
            name="Holder 2",
            password="pass123",
            role="holder"
        )
        holder2.national_id_verified = True
        holder2.save()
        
        cred = Credential.objects.create(
            credential_id="cred-123",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="active"
        )
        
        # Rematch to holder2
        result = MatchingService.rematch_credential(cred, holder2)
        
        self.assertEqual(result.holder, holder2)
        self.assertEqual(result.status, "active")
    
    def test_cannot_rematch_revoked_credential(self):
        """Cannot rematch a revoked credential."""
        holder2 = CustomUser.objects.create_user(
            email="holder2@test.com",
            name="Holder 2",
            password="pass123",
            role="holder"
        )
        
        cred = Credential.objects.create(
            credential_id="cred-123",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="revoked",
            revoked_at=timezone.now()
        )
        
        with self.assertRaises(InvalidStatusTransitionException):
            MatchingService.rematch_credential(cred, holder2)
    
    def test_get_pending_credentials_for_holder(self):
        """Get pending credentials for holder with verified national ID."""
        # Create pending credentials
        Credential.objects.create(
            credential_id="pending-1",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        # Get pending
        pending = MatchingService.get_pending_for_holder(self.holder)
        
        # Should return pending even though holder is not assigned
        self.assertGreater(pending.count(), 0)
    
    def test_idempotent_matching(self):
        """Matching the same credentials again is idempotent."""
        # Create credentials
        Credential.objects.create(
            credential_id="cred-1",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        # Match once
        count1 = MatchingService.match_for_national_id(self.holder, "123456789")
        self.assertEqual(count1, 1)
        
        # Match again - should find 0 pending
        count2 = MatchingService.match_for_national_id(self.holder, "123456789")
        self.assertEqual(count2, 0)
    
    def test_matching_only_pending_not_active(self):
        """Matching only matches pending_match status, not active."""
        # Create active credential (already matched)
        Credential.objects.create(
            credential_id="cred-active",
            organization=self.organization,
            national_id="123456789",
            holder=self.holder,
            credential_type="degree",
            title="Degree",
            data={},
            issued_at=timezone.now(),
            status="active"
        )
        
        # Create pending credential
        Credential.objects.create(
            credential_id="cred-pending",
            organization=self.organization,
            national_id="123456789",
            holder=None,
            credential_type="degree",
            title="Other Degree",
            data={},
            issued_at=timezone.now(),
            status="pending_match"
        )
        
        # Match - should only match pending
        count = MatchingService.match_for_national_id(self.holder, "123456789")
        self.assertEqual(count, 1)
        
        # Verify only pending was matched
        pending_cred = Credential.objects.get(credential_id="cred-pending")
        self.assertEqual(pending_cred.holder, self.holder)
        self.assertEqual(pending_cred.status, "active")
        
        active_cred = Credential.objects.get(credential_id="cred-active")
        self.assertEqual(active_cred.holder, self.holder)
        self.assertEqual(active_cred.status, "active")
