"""
Phase 5 Organization Registration Service with integration field validation.
"""

import logging
import secrets
import hashlib
from datetime import datetime
from django.utils import timezone
from django.conf import settings

from apps.organizations.models import Organization
from apps.organizations.utils.crypto import PublicKeyValidator, PublicKeyValidationError

logger = logging.getLogger(__name__)


class RegistrationValidationError(Exception):
    """Raised when registration validation fails."""
    pass


class OrganizationRegistrationService:
    """
    Service for registering organizations with Phase 5 integration requirements.
    
    Validates:
    - base_api_url is a valid URL
    - api_token is provided and non-empty
    - public_key is a valid RSA PEM key (fail fast)
    """

    @staticmethod
    def validate_integration_fields(base_api_url: str, api_token: str, public_key: str) -> dict:
        """
        Validate organization integration fields at registration time.
        
        Fails fast on public key malformation - reject immediately rather than
        discovering later during verification.
        
        Args:
            base_api_url: Root URL for organization's API
            api_token: Bearer token for calling org's API
            public_key: PEM-formatted RSA public key
            
        Returns:
            dict: Validation results with any issues
            
        Raises:
            RegistrationValidationError: If validation fails
        """
        issues = []
        
        # Validate base_api_url
        if not base_api_url or not base_api_url.strip():
            issues.append("base_api_url cannot be empty")
        elif not (base_api_url.startswith("http://") or base_api_url.startswith("https://")):
            issues.append("base_api_url must start with http:// or https://")
        
        # Validate api_token
        if not api_token or not api_token.strip():
            issues.append("api_token cannot be empty")
        elif len(api_token) < 20:
            issues.append("api_token appears too short (should be JWT or long bearer token)")
        
        # Validate public_key - collect issue, then fail fast
        try:
            PublicKeyValidator.validate_rsa_public_key(public_key)
        except PublicKeyValidationError as e:
            issues.append(f"public_key is invalid: {str(e)}")
        
        if issues:
            raise RegistrationValidationError(
                f"Registration validation failed: {'; '.join(issues)}"
            )
        
        # Generate key fingerprint for logging
        try:
            fingerprint = PublicKeyValidator.get_key_fingerprint(public_key)
        except (PublicKeyValidationError, Exception):
            fingerprint = "unknown"
        
        return {
            "valid": True,
            "key_fingerprint": fingerprint
        }

    @staticmethod
    def register_organization(
        org_name: str,
        org_type,
        email: str,
        base_api_url: str,
        api_token: str,
        public_key: str,
        **kwargs
    ) -> Organization:
        """
        Register a new organization with integration fields.
        
        Public key validation happens at this point - malformed keys are rejected immediately.
        
        Args:
            org_name: Organization name
            org_type: OrganizationType FK
            email: Contact email
            base_api_url: Root URL for org's API endpoints
            api_token: Bearer token for platform to use when calling org's API
            public_key: PEM-formatted RSA public key
            **kwargs: Additional fields (phone, address, website, contact_person, etc.)
            
        Returns:
            Organization: Created organization instance
            
        Raises:
            RegistrationValidationError: If validation fails
        """
        try:
            # Validate all integration fields early
            validation_result = OrganizationRegistrationService.validate_integration_fields(
                base_api_url, api_token, public_key
            )
            
            logger.info(
                f"Registering organization {org_name} with key fingerprint {validation_result['key_fingerprint']}"
            )
            
            # Create organization
            org = Organization.objects.create(
                name=org_name,
                org_type=org_type,
                email=email,
                base_api_url=base_api_url,
                api_token=api_token,  # Will be encrypted by field handler if configured
                public_key=public_key,
                public_key_verified_at=timezone.now(),  # Verified at registration
                status="pending",  # Will be changed to "approved" by admin
                **kwargs
            )
            
            logger.info(f"Organization {org.id} registered successfully (status: pending)")
            return org
            
        except RegistrationValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to register organization {org_name}: {e}")
            raise RegistrationValidationError(
                f"Failed to register organization: {str(e)}"
            )

    @staticmethod
    def generate_webhook_credentials() -> tuple:
        """
        Generate platform webhook URL and secret for an organization.
        
        Called when organization is approved.
        
        Returns:
            tuple: (webhook_url, webhook_secret_plaintext)
            
        The webhook_secret should be shown to org admin exactly once, then
        stored encrypted. The webhook_url is generated by the platform.
        """
        # Generate cryptographically secure secret
        webhook_secret = secrets.token_urlsafe(32)
        
        # Generate webhook URL using organization ID (will be filled in by caller)
        # Format: https://platform.example.com/webhooks/organizations/{org_id}/{random_token}/
        webhook_token = secrets.token_urlsafe(16)
        
        # This will be completed by caller with actual domain and org_id
        webhook_url_template = f"/webhooks/organizations/{{org_id}}/{webhook_token}/"
        
        return webhook_url_template, webhook_secret

    @staticmethod
    def hash_webhook_secret(secret: str) -> str:
        """
        Hash webhook secret for secure storage.
        
        Args:
            secret: Plaintext webhook secret
            
        Returns:
            SHA256 hash of secret
        """
        return hashlib.sha256(secret.encode()).hexdigest()

    @staticmethod
    def approve_organization_integration(
        organization: Organization,
        approved_by,
        webhook_base_url: str = None
    ) -> dict:
        """
        Approve organization and generate webhook credentials.
        
        Called when admin approves organization. Generates platform webhook URL
        and secret, hashes the secret, and stores it.
        
        Args:
            organization: Organization instance to approve
            approved_by: Admin user who approved
            webhook_base_url: Base URL for webhook (e.g., "https://platform.example.com")
            
        Returns:
            dict: {
                'webhook_url': str (full URL for org to use),
                'webhook_secret': str (plaintext - shown once to admin),
                'webhook_secret_hash': str (stored in DB)
            }
        """
        # Generate webhook credentials
        webhook_url_template, webhook_secret_plaintext = OrganizationRegistrationService.generate_webhook_credentials()
        
        # Build full webhook URL if base provided
        if webhook_base_url:
            base = webhook_base_url.rstrip('/')
            webhook_url = base + webhook_url_template.format(org_id=organization.id)
        else:
            # Use default from settings or placeholder
            default_base = getattr(settings, 'WEBHOOK_BASE_URL', 'https://platform.example.com')
            base = default_base.rstrip('/')
            webhook_url = base + webhook_url_template.format(org_id=organization.id)
        
        # Hash secret for storage
        webhook_secret_hash = OrganizationRegistrationService.hash_webhook_secret(webhook_secret_plaintext)
        
        # Update organization
        organization.status = "approved"
        organization.approved_by = approved_by
        organization.approved_at = timezone.now()
        organization.platform_webhook_url = webhook_url
        organization.platform_webhook_secret = webhook_secret_hash  # Store hash, not plaintext
        organization.platform_webhook_secret_encrypted = True  # Mark as "secured"
        organization.save(update_fields=[
            'status', 'approved_by', 'approved_at',
            'platform_webhook_url', 'platform_webhook_secret',
            'platform_webhook_secret_encrypted'
        ])
        
        logger.info(f"Organization {organization.id} approved. Webhook URL: {webhook_url}")
        
        return {
            'webhook_url': webhook_url,
            'webhook_secret': webhook_secret_plaintext,  # Only shown once
            'organization_id': str(organization.id),
            'organization_name': organization.name
        }

    @staticmethod
    def rotate_webhook_secret(organization: Organization, rotated_by) -> dict:
        """
        Rotate (regenerate) webhook secret for an organization.
        
        Can only be done by admin. Returns new secret plaintext (shown once).
        
        Args:
            organization: Organization to rotate secret for
            rotated_by: Admin user performing rotation
            
        Returns:
            dict: New webhook credentials
        """
        if organization.status != "approved":
            raise RegistrationValidationError(
                f"Cannot rotate secret for organization with status '{organization.status}'. "
                f"Organization must be approved."
            )
        
        # Generate new secret
        new_secret_plaintext = secrets.token_urlsafe(32)
        new_secret_hash = OrganizationRegistrationService.hash_webhook_secret(new_secret_plaintext)
        
        # Update organization
        organization.platform_webhook_secret = new_secret_hash
        organization.save(update_fields=['platform_webhook_secret'])
        
        logger.info(f"Webhook secret rotated for organization {organization.id}")
        
        return {
            'webhook_url': organization.platform_webhook_url,
            'webhook_secret': new_secret_plaintext,  # Only shown once
            'organization_id': str(organization.id),
            'organization_name': organization.name
        }
