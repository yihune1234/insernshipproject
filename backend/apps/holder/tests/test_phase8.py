"""
Phase 8: Holder Validation - Comprehensive Tests

Tests the holder identity validation against organization systems.
Verifies the complete validation pipeline:
1. Holder has holder role + verified KYC
2. Organization is approved + trusted
3. Organization connection is healthy
4. Holder exists and is active at organization
5. Mapping is stored for Phase 9 reuse
"""

import pytest
from unittest.mock import patch, MagicMock
import httpx

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation
from apps.holder.models import HolderOrgMapping
from apps.holder.services import HolderValidationService
from apps.issuer.services import IntegrationManagementService
from apps.holder.services.holder_validation_service import (
    HolderNotVerifiedException,
    HolderNotFoundAtOrgException,
    HolderInactiveException,
    OrganizationNotTrustedException,
    OrganizationConnectionFailedException,
    HolderValidationException,
)


class Phase8HolderValidationTests(TestCase):
    """Test Phase 8 holder validation."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.org_type = OrganizationType.objects.create(
            name="University",
            description="Educational Institution"
        )
        
        cls.admin = CustomUser.objects.create_user(
            email="admin@test.com",
            name="Admin User",
            password="pass123",
            role="admin"
        )
    
    def setUp(self):
        """Set up for each test."""
        self.holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder User",
            password="pass123",
            role="holder"
        )
        
        self.organization = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@university.edu",
            base_api_url="https://api.university.edu",
            api_token="test-token-123",
            status="approved",
            public_key="""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplEJBZE9Hl4Qs4N
-----END PUBLIC KEY-----""",
            public_key_verified_at=timezone.now()
        )
        
        # Create accreditation (trust)
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=3
        )
        
        # Create integration config with healthy connection
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.connection_health = "healthy"
        config.last_health_check_at = timezone.now()
        config.save()
    
    def test_reject_non_holder_role(self):
        """Validation rejects non-holder roles."""
        issuer = CustomUser.objects.create_user(
            email="issuer@test.com",
            name="Issuer",
            password="pass123",
            role="issuer"
        )
        
        with self.assertRaises(HolderValidationException) as cm:
            HolderValidationService.validate_holder_for_organization(issuer, self.organization)
        
        self.assertIn("Only holders can validate", str(cm.exception))
    
    def test_reject_holder_without_kyc_verification(self):
        """Validation rejects holder without verified KYC."""
        self.holder.national_id_verified = False
        self.holder.save()
        
        with self.assertRaises(HolderNotVerifiedException) as cm:
            HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("verified national ID", str(cm.exception))
    
    def test_reject_unapproved_organization(self):
        """Validation rejects unapproved organizations."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        self.organization.status = "pending"
        self.organization.save()
        
        with self.assertRaises(OrganizationNotTrustedException) as cm:
            HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("not approved", str(cm.exception))
    
    def test_reject_untrusted_organization(self):
        """Validation rejects untrusted organizations."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Remove accreditation (untrust)
        Accreditation.objects.filter(organization=self.organization).delete()
        
        with self.assertRaises(OrganizationNotTrustedException) as cm:
            HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("not currently trusted", str(cm.exception))
    
    def test_reject_unhealthy_connection(self):
        """Validation rejects organizations with unhealthy connections."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Mark connection as unreachable
        config = self.organization.integration_config
        config.connection_health = "unreachable"
        config.save()
        
        with self.assertRaises(OrganizationConnectionFailedException) as cm:
            HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("unreachable", str(cm.exception))
    
    def test_reject_holder_not_found_at_org(self):
        """Validation rejects holder not found at organization (404)."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Mock 404 response from organization API
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 404
            mock_get.return_value = mock_response
            
            with self.assertRaises(HolderNotFoundAtOrgException) as cm:
                HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("not found", str(cm.exception))
    
    def test_reject_inactive_holder_at_org(self):
        """Validation rejects holder that exists but is inactive."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Mock response with inactive holder
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "internal_id": "holder-123",
                "is_active": False
            }
            mock_get.return_value = mock_response
            
            with self.assertRaises(HolderInactiveException) as cm:
                HolderValidationService.validate_holder_for_organization(self.holder, self.organization)
        
        self.assertIn("not active", str(cm.exception))
    
    def test_successful_validation_creates_mapping(self):
        """Successful validation creates holder-org mapping."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Mock successful response
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "internal_id": "holder-123",
                "is_active": True,
                "name": "John Doe"
            }
            mock_get.return_value = mock_response
            
            mapping = HolderValidationService.validate_holder_for_organization(
                self.holder, self.organization
            )
        
        # Verify mapping created
        self.assertIsNotNone(mapping)
        self.assertEqual(mapping.holder, self.holder)
        self.assertEqual(mapping.organization, self.organization)
        self.assertEqual(mapping.internal_id, "holder-123")
        self.assertTrue(mapping.is_active)
        
        # Verify mapping persisted
        db_mapping = HolderOrgMapping.objects.get(
            holder=self.holder,
            organization=self.organization
        )
        self.assertEqual(db_mapping.internal_id, "holder-123")
    
    def test_re_validation_updates_mapping(self):
        """Re-validating holder updates existing mapping."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Create initial mapping
        initial_mapping = HolderOrgMapping.objects.create(
            holder=self.holder,
            organization=self.organization,
            internal_id="holder-old-id"
        )
        
        # Re-validate with new ID
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "internal_id": "holder-new-id",
                "is_active": True
            }
            mock_get.return_value = mock_response
            
            mapping = HolderValidationService.validate_holder_for_organization(
                self.holder, self.organization
            )
        
        # Should update existing mapping, not create new
        self.assertEqual(mapping.id, initial_mapping.id)
        self.assertEqual(mapping.internal_id, "holder-new-id")
        
        # Verify only one mapping exists
        count = HolderOrgMapping.objects.filter(
            holder=self.holder,
            organization=self.organization
        ).count()
        self.assertEqual(count, 1)
    
    def test_connection_timeout_rejected(self):
        """Validation rejects if organization API times out."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Mock timeout
        with patch('httpx.Client.get') as mock_get:
            mock_get.side_effect = httpx.TimeoutException("timeout")
            
            with self.assertRaises(OrganizationConnectionFailedException) as cm:
                HolderValidationService.validate_holder_for_organization(
                    self.holder, self.organization
                )
        
        self.assertIn("Timeout", str(cm.exception))
    
    def test_invalidate_mapping_on_org_untrust(self):
        """Mapping can be invalidated when org becomes untrusted."""
        # Create mapping
        mapping = HolderOrgMapping.objects.create(
            holder=self.holder,
            organization=self.organization,
            internal_id="holder-123"
        )
        
        # Invalidate
        HolderValidationService.invalidate_mapping(self.holder, self.organization)
        
        # Verify invalidated
        mapping.refresh_from_db()
        self.assertFalse(mapping.is_active)
        self.assertIn("untrusted", mapping.validation_error)
    
    def test_get_or_validate_uses_existing_mapping(self):
        """Get or validate returns existing active mapping."""
        # Create active mapping
        existing_mapping = HolderOrgMapping.objects.create(
            holder=self.holder,
            organization=self.organization,
            internal_id="holder-123",
            is_active=True
        )
        
        # Get or validate should return existing without API call
        with patch('httpx.Client.get') as mock_get:
            mapping = HolderValidationService.get_or_validate_mapping(
                self.holder, self.organization
            )
            
            # Should not call API
            mock_get.assert_not_called()
        
        self.assertEqual(mapping.id, existing_mapping.id)
    
    def test_get_or_validate_validates_if_missing(self):
        """Get or validate validates if no active mapping exists."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # No mapping exists
        self.assertFalse(
            HolderOrgMapping.objects.filter(
                holder=self.holder,
                organization=self.organization
            ).exists()
        )
        
        # Mock successful validation
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "internal_id": "holder-123",
                "is_active": True
            }
            mock_get.return_value = mock_response
            
            mapping = HolderValidationService.get_or_validate_mapping(
                self.holder, self.organization
            )
        
        # Should create mapping
        self.assertEqual(mapping.internal_id, "holder-123")
        self.assertTrue(mapping.is_active)
    
    def test_get_or_validate_re_validates_if_inactive(self):
        """Get or validate re-validates if mapping is inactive."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        # Create inactive mapping
        HolderOrgMapping.objects.create(
            holder=self.holder,
            organization=self.organization,
            internal_id="holder-old",
            is_active=False
        )
        
        # Mock successful re-validation
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "internal_id": "holder-new",
                "is_active": True
            }
            mock_get.return_value = mock_response
            
            mapping = HolderValidationService.get_or_validate_mapping(
                self.holder, self.organization
            )
        
        # Should use new ID (re-validated)
        self.assertEqual(mapping.internal_id, "holder-new")
        self.assertTrue(mapping.is_active)
