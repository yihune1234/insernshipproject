"""
Phase 9: Credential Synchronization - Comprehensive Tests

Tests the complete sync pipeline with all required gates:
- Phase 6 (Trust Registry): Organization must be trusted
- Phase 7 (Connection): Organization connection must be healthy
- Phase 8 (Holder Validation): Holder must be validated (if holder-specific sync)
- Phase 9 (Sync): Pull credentials from organization
"""

from unittest.mock import patch, MagicMock
import httpx
import json

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.organizations.models import Organization, OrganizationType
from apps.trust_registry.models import Accreditation
from apps.holder.models import HolderOrgMapping
from apps.credentials.services.integration_service import IntegrationService
from apps.credentials.services.sync_service import SyncService
from apps.credentials.models import SyncLog
from apps.credentials.exceptions import IntegrationErrorException
from apps.issuer.services import IntegrationManagementService


class Phase9SyncPipelineTests(TestCase):
    """Test Phase 9 credential sync pipeline."""
    
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
            status="approved",
            public_key="""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplEJBZE9Hl4Qs4N
-----END PUBLIC KEY-----""",
            public_key_verified_at=timezone.now()
        )
        
        # Create accreditation (trust - Phase 6)
        Accreditation.objects.create(
            organization=self.organization,
            status="approved",
            accredited_by=self.admin,
            trust_level=3
        )
        
        # Create integration config with healthy connection (Phase 7)
        config = IntegrationManagementService.get_or_create_config(self.organization)
        config.connection_health = "healthy"
        config.last_health_check_at = timezone.now()
        config.save()
    
    def test_sync_rejected_untrusted_organization(self):
        """Sync is rejected if organization is not trusted (Phase 6)."""
        # Remove accreditation
        Accreditation.objects.filter(organization=self.organization).delete()
        
        with self.assertRaises(IntegrationErrorException) as cm:
            IntegrationService.sync_organization(self.organization)
        
        self.assertIn("not currently trusted", str(cm.exception))
    
    def test_sync_rejected_unhealthy_connection(self):
        """Sync is rejected if connection is not healthy (Phase 7)."""
        # Mark connection as unreachable
        config = self.organization.integration_config
        config.connection_health = "unreachable"
        config.save()
        
        with self.assertRaises(IntegrationErrorException) as cm:
            IntegrationService.sync_organization(self.organization)
        
        self.assertIn("unreachable", str(cm.exception))
    
    def test_sync_rejected_holder_not_validated(self):
        """Sync rejected for specific holder if holder not validated (Phase 8)."""
        holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder",
            password="pass123",
            role="holder"
        )
        
        # Holder has no KYC
        holder.national_id_verified = False
        holder.save()
        
        # Holder-specific sync should fail validation
        with self.assertRaises(IntegrationErrorException):
            IntegrationService.sync_organization(self.organization, holder=holder)
    
    def test_sync_creates_sync_log(self):
        """Sync creates sync log entry."""
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = []
            mock_get.return_value = mock_response
            
            IntegrationService.sync_organization(self.organization)
        
        # Verify sync log created
        log = SyncLog.objects.get(organization=self.organization)
        self.assertEqual(log.status, "completed")
        self.assertEqual(log.sync_type, "scheduled")
    
    def test_sync_successful_creates_credentials(self):
        """Successful sync creates credentials."""
        credentials = [
            {
                "credential_id": "cred-1",
                "subject": "did:example:holder",
                "issuer": "did:example:issuer",
                "claim_types": ["urn:example:degree"],
                "claims": {"degree": "Bachelor"},
                "issued_at": "2026-01-01T00:00:00Z",
                "expires_at": "2036-01-01T00:00:00Z",
            },
            {
                "credential_id": "cred-2",
                "subject": "did:example:holder",
                "issuer": "did:example:issuer",
                "claim_types": ["urn:example:employment"],
                "claims": {"position": "Engineer"},
                "issued_at": "2026-02-01T00:00:00Z",
                "expires_at": "2036-02-01T00:00:00Z",
            }
        ]
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = credentials
            mock_get.return_value = mock_response
        
            # Mock credential service
            with patch('apps.credentials.services.integration_service.CredentialService') as mock_service:
                mock_service.save.return_value = MagicMock()
                
                result = IntegrationService.sync_organization(self.organization)
        
        self.assertEqual(result.processed, 2)
        self.assertEqual(result.created, 2)
        self.assertEqual(result.updated, 0)
        self.assertEqual(result.failed, 0)
    
    def test_sync_updates_existing_credentials(self):
        """Sync updates existing credentials (no duplicates)."""
        # Mock returning same credential twice (simulating re-sync)
        credentials = [
            {
                "credential_id": "cred-1",
                "subject": "did:example:holder",
                "claims": {"degree": "Bachelor"}
            }
        ]
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = credentials
            mock_get.return_value = mock_response
        
            with patch('apps.credentials.services.integration_service.CredentialService') as mock_service:
                mock_service.save.return_value = MagicMock()
                mock_service.update.return_value = MagicMock()
                
                # Mock that credential exists
                from apps.credentials.models import Credential
                with patch.object(Credential.objects, 'filter') as mock_filter:
                    mock_filter.return_value.exists.return_value = True
                    
                    with patch.object(Credential.objects, 'get') as mock_get_cred:
                        mock_get_cred.return_value = MagicMock()
                        
                        result = IntegrationService.sync_organization(self.organization)
        
        self.assertEqual(result.processed, 1)
        self.assertEqual(result.updated, 1)
        self.assertEqual(result.created, 0)
    
    def test_sync_handles_api_errors_gracefully(self):
        """Sync handles individual credential errors gracefully."""
        credentials = [
            {"credential_id": "cred-1", "subject": "did:example:holder"},
            {"credential_id": "cred-2", "subject": "did:example:holder"},
        ]
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = credentials
            mock_get.return_value = mock_response
        
            with patch('apps.credentials.services.integration_service.CredentialService') as mock_service:
                # First credential fails, second succeeds
                mock_service.save.side_effect = [Exception("Parse error"), MagicMock()]
                
                result = IntegrationService.sync_organization(self.organization)
        
        self.assertEqual(result.processed, 2)
        self.assertEqual(result.created, 1)
        self.assertEqual(result.failed, 1)
        self.assertEqual(len(result.errors), 1)
    
    def test_sync_holder_specific_uses_holder_endpoint(self):
        """Holder-specific sync uses holder endpoint."""
        holder = CustomUser.objects.create_user(
            email="holder@test.com",
            name="Holder",
            password="pass123",
            role="holder"
        )
        holder.national_id_verified = True
        holder.save()
        
        # Create holder mapping
        HolderOrgMapping.objects.create(
            holder=holder,
            organization=self.organization,
            internal_id="holder-123"
        )
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = []
            mock_get.return_value = mock_response
        
            IntegrationService.sync_organization(self.organization, holder=holder)
        
        # Verify called holder-specific endpoint
        called_url = mock_get.call_args[0][0]
        self.assertIn("/holders/holder-123/credentials", called_url)
    
    def test_sync_handles_connection_timeout(self):
        """Sync handles connection timeouts."""
        with patch('httpx.Client.get') as mock_get:
            mock_get.side_effect = httpx.TimeoutException("timeout")
            
            result = IntegrationService.sync_organization(self.organization)
        
        # Sync log should record failure
        log = SyncLog.objects.get(organization=self.organization)
        self.assertEqual(log.status, "failed")
        self.assertIn("timed out", log.error_message)
    
    def test_sync_includes_since_parameter(self):
        """Sync includes since parameter for incremental sync."""
        since_time = timezone.now() - timezone.timedelta(hours=1)
        
        with patch('httpx.Client.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = []
            mock_get.return_value = mock_response
        
            IntegrationService.sync_organization(self.organization, since=since_time)
        
        # Verify since parameter included
        called_params = mock_get.call_args[1].get('params', {})
        self.assertIn('since', called_params)


class Phase9SyncServiceTests(TestCase):
    """Test Phase 9 sync service orchestration."""
    
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
        self.org1 = Organization.objects.create(
            name="University 1",
            org_type=self.org_type,
            email="uni1@test.edu",
            base_api_url="https://api1.edu",
            api_token="token1",
            status="approved",
            public_key="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
            public_key_verified_at=timezone.now()
        )
        
        self.org2 = Organization.objects.create(
            name="University 2",
            org_type=self.org_type,
            email="uni2@test.edu",
            base_api_url="https://api2.edu",
            api_token="token2",
            status="approved",
            public_key="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
            public_key_verified_at=timezone.now()
        )
    
    def test_sync_all_skips_untrusted_orgs(self):
        """Sync all skips untrusted organizations."""
        # Only org1 is trusted
        Accreditation.objects.create(
            organization=self.org1,
            status="approved",
            accredited_by=self.admin,
            trust_level=3
        )
        
        with patch('apps.credentials.services.integration_service.IntegrationService.sync_organization') as mock_sync:
            mock_sync.return_value = MagicMock(processed=0, created=0, updated=0, failed=0, errors=[])
            
            summary = SyncService.sync_all()
        
        # org1 should be synced, org2 skipped
        self.assertEqual(summary["total"], 1)
        self.assertEqual(summary["skipped"], 1)
    
    def test_sync_all_collects_results(self):
        """Sync all collects results from all orgs."""
        # Both orgs trusted
        for org in [self.org1, self.org2]:
            Accreditation.objects.create(
                organization=org,
                status="approved",
                accredited_by=self.admin,
                trust_level=3
            )
        
        with patch('apps.credentials.services.integration_service.IntegrationService.sync_organization') as mock_sync:
            mock_result = MagicMock(processed=5, created=2, updated=3, failed=0, errors=[])
            mock_sync.return_value = mock_result
            
            summary = SyncService.sync_all()
        
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["success"], 2)
        self.assertEqual(len(summary["details"]), 2)
    
    def test_sync_all_handles_sync_errors(self):
        """Sync all handles errors during sync gracefully."""
        Accreditation.objects.create(
            organization=self.org1,
            status="approved",
            accredited_by=self.admin,
            trust_level=3
        )
        
        with patch('apps.credentials.services.integration_service.IntegrationService.sync_organization') as mock_sync:
            mock_sync.side_effect = Exception("API error")
            
            summary = SyncService.sync_all()
        
        self.assertEqual(summary["failed"], 1)
        self.assertIn("error", summary["details"][0])
