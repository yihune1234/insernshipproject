"""
Phase 7: Connection Management - Comprehensive Tests

Tests the connection health checking and monitoring functionality.
Verifies that connections can only be active when organization is:
- Approved (Phase 5)
- Currently trusted (Phase 6)
"""

import pytest
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.utils import timezone
from django.test import TestCase

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation
from apps.issuer.models import IntegrationConfig
from apps.issuer.services import ConnectionMonitorService, IntegrationManagementService

# Valid RSA 2048-bit public key for testing
VALID_TEST_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAufXbGZNpAfi0E5ZPTaF6
ZbKv+/wDHVf5bxepb8UaAbzXMwkerV8WMo1b3OdcAdYKuukzk6f9tdIxtRPY5uEp
p4LH0rMARR/FHAIerMLaVrV3kYpxxFh4KTGT1L2Ihe6izz0c0f1NCq9HkAoN8gMK
MJ9krltBlN1rFWs4dkkWJ6T7RBmIuH/LEQyLHBwxjac0kB/h85quiSz9ADWmArUb
QImghJ58R0XL+vNx9OumRT56m/2cxtcZtCrSNSaXawqIvEXKUOoUYhsUtvTu1b82
h39lX5BBGbykj5WkgMxWEYmUFd1ya6pbIUj4wO0mp2pYWqk+EZZk/EflhPabsx15
JwIDAQAB
-----END PUBLIC KEY-----"""


class Phase7ConnectionHealthTests(TestCase):
    """Test Phase 7 connection health checking."""
    
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
        self.organization = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@university.edu",
            base_api_url="https://api.university.edu",
            api_token="test-token-123",
            status="pending"
        )
    
    def test_health_check_rejected_unapproved_org(self):
        """Health check should reject unapproved organizations."""
        # Organization is not approved
        self.organization.status = "pending"
        self.organization.save()
        
        health = ConnectionMonitorService.check_health(self.organization)
        
        # Health should be unknown (cannot check unapproved)
        self.assertEqual(health, "unknown")
        
        config = self.organization.integration_config
        self.assertEqual(config.connection_health, "unknown")
    
    def test_health_check_rejected_untrusted_org(self):
        """Health check should reject untrusted organizations."""
        # Organization is approved
        self.organization.status = "approved"
        self.organization.save()
        
        # But not accredited (not trusted)
        # No accreditation record exists
        
        health = ConnectionMonitorService.check_health(self.organization)
        
        # Health should be unknown (cannot check untrusted)
        self.assertEqual(health, "unknown")
    
    def test_health_check_success_for_trusted_approved_org(self):
        """Health check succeeds for approved and trusted organization."""
        # Organization is approved
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        # Organization is trusted (accredited)
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        # Mock successful HTTP response
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            health = ConnectionMonitorService.check_health(self.organization)
        
        # Should be healthy
        self.assertEqual(health, "healthy")
        
        config = self.organization.integration_config
        self.assertEqual(config.connection_health, "healthy")
        self.assertIsNotNone(config.last_health_check_at)
    
    def test_health_check_degraded_on_500_error(self):
        """Health check returns degraded for 5xx errors."""
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        # Mock 500 response
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_get.return_value = mock_response
            
            health = ConnectionMonitorService.check_health(self.organization)
        
        self.assertEqual(health, "degraded")
    
    def test_health_check_timeout_unreachable(self):
        """Health check returns unreachable on timeout."""
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        # Mock timeout
        import httpx
        with patch('httpx.Client.get') as mock_get:
            mock_get.side_effect = httpx.TimeoutException("timeout")
            
            health = ConnectionMonitorService.check_health(self.organization)
        
        self.assertEqual(health, "unreachable")
    
    def test_health_check_missing_api_url(self):
        """Health check returns unknown if no API URL configured."""
        self.organization.status = "approved"
        self.organization.base_api_url = None
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        health = ConnectionMonitorService.check_health(self.organization)
        
        self.assertEqual(health, "unknown")
    
    def test_get_health_status_unknown_if_no_check(self):
        """Get health status returns unknown if no check has been done."""
        self.organization.status = "approved"
        self.organization.save()
        
        health = ConnectionMonitorService.get_health_status(self.organization)
        
        self.assertEqual(health, "unknown")
    
    def test_get_health_status_unknown_if_stale(self):
        """Get health status returns unknown if last check is too old."""
        self.organization.status = "approved"
        self.organization.save()
        
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.connection_health = "healthy"
        # Mark check as 25 hours old (staleness threshold is 24 hours)
        config.last_health_check_at = timezone.now() - timedelta(hours=25)
        config.save()
        
        health = ConnectionMonitorService.get_health_status(self.organization)
        
        self.assertEqual(health, "unknown")
    
    def test_check_all_organizations_summary(self):
        """Check all organizations returns summary."""
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.sync_enabled = True
        config.save()
        
        # Mock successful health check
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            summary = ConnectionMonitorService.check_all_organizations()
        
        self.assertEqual(summary["total"], 1)
        self.assertEqual(summary["healthy"], 1)


class Phase7IntegrationManagementTests(TestCase):
    """Test Phase 7 integration management."""
    
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
        self.organization = Organization.objects.create(
            name="Test University",
            org_type=self.org_type,
            email="contact@university.edu",
            base_api_url="https://api.university.edu",
            api_token="test-token-123",
            status="pending"
        )
    
    def test_is_connection_active_requires_approval(self):
        """Connection is not active if organization not approved."""
        self.organization.status = "pending"
        self.organization.save()
        
        is_active = IntegrationManagementService.is_connection_active(self.organization)
        
        self.assertFalse(is_active)
    
    def test_is_connection_active_requires_trust(self):
        """Connection is not active if organization not trusted."""
        self.organization.status = "approved"
        self.organization.save()
        
        # No accreditation = not trusted
        is_active = IntegrationManagementService.is_connection_active(self.organization)
        
        self.assertFalse(is_active)
    
    def test_is_connection_active_requires_healthy_connection(self):
        """Connection is not active if health check failed."""
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        # Connection health is unknown (never checked)
        is_active = IntegrationManagementService.is_connection_active(self.organization)
        
        self.assertFalse(is_active)
    
    def test_is_connection_active_true_when_all_requirements_met(self):
        """Connection is active when approved, trusted, and healthy."""
        self.organization.status = "approved"
        self.organization.public_key = VALID_TEST_PUBLIC_KEY
        self.organization.public_key_verified_at = timezone.now()
        self.organization.save()
        
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=1
        )
        
        # Set connection as healthy
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.connection_health = "healthy"
        config.save()
        
        is_active = IntegrationManagementService.is_connection_active(self.organization)
        
        self.assertTrue(is_active)
    
    def test_record_successful_sync_updates_status(self):
        """Record successful sync updates config."""
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.consecutive_failures = 5
        config.save()
        
        IntegrationManagementService.record_successful_sync(self.organization)
        
        config.refresh_from_db()
        self.assertEqual(config.consecutive_failures, 0)
        self.assertEqual(config.sync_status, "success")
        self.assertEqual(config.connection_health, "healthy")
        self.assertIsNotNone(config.last_sync_at)
    
    def test_record_failed_sync_increments_failures(self):
        """Record failed sync increments failure count."""
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.consecutive_failures = 0
        config.save()
        
        IntegrationManagementService.record_failed_sync(self.organization, "API error")
        
        config.refresh_from_db()
        self.assertEqual(config.consecutive_failures, 1)
        self.assertEqual(config.sync_status, "error")
        self.assertEqual(config.connection_health, "degraded")
    
    def test_record_failed_sync_marks_unreachable_after_threshold(self):
        """Record failed sync marks unreachable after 3 failures."""
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.consecutive_failures = 2
        config.save()
        
        IntegrationManagementService.record_failed_sync(self.organization, "API error")
        
        config.refresh_from_db()
        self.assertEqual(config.consecutive_failures, 3)
        self.assertEqual(config.connection_health, "unreachable")