import logging

import httpx
from django.conf import settings
from django.utils import timezone

from apps.credentials.exceptions import (
    CredentialNotFoundException,
    IntegrationConnectionException,
    IntegrationErrorException,
    IntegrationTimeoutException,
)
from apps.credentials.models import Credential, SyncLog
from apps.credentials.services.credential_service import CredentialService
from apps.credentials.utils import SyncResult
from apps.credentials.utils.signature_utils import SignatureUtils
from apps.holder.services import HolderValidationService
from apps.holder.services.holder_validation_service import HolderValidationException
from apps.trust_registry.services import TrustService

logger = logging.getLogger(__name__)


class IntegrationService:
    """
    Phase 9: Credential Synchronization from organization APIs.
    
    Implements the full sync pipeline with all required gates:
    - Phase 6 (Trust Registry): Organization must be trusted
    - Phase 7 (Connection): Organization connection must be healthy
    - Phase 8 (Holder Validation): Holder must be validated at organization
    - Phase 9 (Sync): Pull credentials from organization
    
    Sync uses organization's API as source of truth; platform stores copies only.
    """

    @classmethod
    def receive_credential(cls, organization, data: dict):
        """
        Receive credential from organization API.
        
        Stores credential after verifying format and optionally signature.
        
        Args:
            organization: Organization providing credential
            data: Credential data dict with fields: credential_id, subject, claims, 
                  signature (optional), raw_payload (optional), etc.
                  
        Returns:
            Credential: Stored/updated credential instance
        """
        if organization.public_key and data.get("signature") and data.get("raw_payload"):
            if not SignatureUtils.verify(organization.public_key, data["raw_payload"], data["signature"]):
                logger.warning("Signature verification failed for org %s", organization.id)

        try:
            existing = Credential.objects.get(credential_id=data["credential_id"])
            return CredentialService.update(existing, data)
        except Credential.DoesNotExist:
            return CredentialService.save(organization, data)

    @classmethod
    def fetch_from_organization(cls, organization, credential_id: str):
        """
        Fetch single credential from organization API.
        
        Args:
            organization: Organization instance
            credential_id: Credential ID to fetch
            
        Returns:
            Credential: Stored/updated credential
            
        Raises:
            IntegrationErrorException: If configuration missing
            CredentialNotFoundException: If credential not found at org
            IntegrationTimeoutException: If request times out
            IntegrationConnectionException: If connection fails
        """
        if not organization.base_api_url:
            raise IntegrationErrorException("Organization has no API URL configured")

        url = f"{organization.base_api_url.rstrip('/')}/api/credentials/{credential_id}/"
        headers = {}
        if organization.api_token:
            headers["Authorization"] = f"Bearer {organization.api_token}"

        try:
            timeout = getattr(settings, 'INTEGRATION_REQUEST_TIMEOUT', 10)
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(url, headers=headers)

            if resp.status_code == 404:
                raise CredentialNotFoundException(f"Credential {credential_id} not found at org API")

            resp.raise_for_status()
            return cls.receive_credential(organization, resp.json())

        except httpx.TimeoutException:
            raise IntegrationTimeoutException()
        except httpx.ConnectError:
            raise IntegrationConnectionException()

    @classmethod
    def sync_organization(cls, organization, holder=None, since=None):
        """
        Main sync entry point with all required gates.
        
        Pipeline:
        1. Verify organization is trusted (Phase 6)
        2. Verify organization connection is healthy (Phase 7)
        3. If holder provided: validate holder at organization (Phase 8)
        4. Fetch credentials from organization API (Phase 9)
        5. Store/update credentials
        
        Args:
            organization: Organization to sync from
            holder: Optional holder to sync for (if None, sync all for org)
            since: Optional datetime to fetch credentials since
            
        Returns:
            SyncResult: Details of sync result
        """
        result = SyncResult()
        sync_log = SyncLog.objects.create(
            organization=organization,
            sync_type="scheduled" if not holder else "holder",
            status="started"
        )

        try:
            # Gate 1: Phase 6 - Verify organization is trusted
            if not TrustService.is_trusted(organization):
                raise IntegrationErrorException(
                    f"Organization {organization.name} is not currently trusted. "
                    f"Sync cannot proceed."
                )

            # Gate 2: Phase 7 - Verify connection is healthy
            if not hasattr(organization, 'integration_config') or not organization.integration_config:
                raise IntegrationErrorException(
                    f"Organization {organization.name} has no integration config"
                )

            config = organization.integration_config
            if config.connection_health not in ["healthy", "degraded"]:
                raise IntegrationErrorException(
                    f"Organization {organization.name} connection is {config.connection_health}. "
                    f"Please run health check (Phase 7) before sync."
                )

            # Gate 3: Phase 8 - If holder provided, validate at organization
            holder_mapping = None
            if holder:
                try:
                    holder_mapping = HolderValidationService.validate_holder_for_organization(
                        holder, organization
                    )
                except HolderValidationException as e:
                    raise IntegrationErrorException(
                        f"Holder validation failed: {str(e)}"
                    )

            # Gate 4: Phase 9 - Fetch credentials from organization API
            if not organization.base_api_url:
                raise IntegrationErrorException("Organization has no API URL configured")

            # Determine endpoint based on whether syncing for specific holder
            if holder and holder_mapping:
                url = f"{organization.base_api_url.rstrip('/')}/api/holders/{holder_mapping.internal_id}/credentials"
            else:
                url = f"{organization.base_api_url.rstrip('/')}/api/credentials/"

            params = {}
            if since:
                params["since"] = since.isoformat()

            headers = {}
            if organization.api_token:
                headers["Authorization"] = f"Bearer {organization.api_token}"

            timeout = getattr(settings, 'SYNC_REQUEST_TIMEOUT', 30)
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(url, params=params, headers=headers)

            resp.raise_for_status()
            items = resp.json() if isinstance(resp.json(), list) else resp.json().get("results", [])

            # Process each credential
            for item in items:
                result.processed += 1
                try:
                    if Credential.objects.filter(credential_id=item.get("credential_id", "")).exists():
                        existing = Credential.objects.get(credential_id=item["credential_id"])
                        CredentialService.update(existing, item)
                        result.updated += 1
                    else:
                        CredentialService.save(organization, item)
                        result.created += 1

                except Exception as e:
                    result.failed += 1
                    result.errors.append(str(e))
                    logger.warning("Failed to process credential %s: %s", item.get("credential_id"), e)

            sync_log.status = "completed"

        except httpx.TimeoutException:
            sync_log.status = "failed"
            sync_log.error_message = "Sync timed out"
            result.errors.append("Sync timed out")
            logger.error("Sync timeout for %s", organization.name)

        except (httpx.HTTPError, IntegrationErrorException, CredentialNotFoundException) as e:
            sync_log.status = "failed"
            sync_log.error_message = str(e)
            result.errors.append(str(e))
            logger.error("Sync failed for %s: %s", organization.name, e)

        except Exception as e:
            sync_log.status = "failed"
            sync_log.error_message = "An unexpected error occurred during sync"
            result.errors.append(str(e))
            logger.exception("Sync failed for %s", organization.name)

        finally:
            sync_log.credentials_processed = result.processed
            sync_log.credentials_created = result.created
            sync_log.credentials_updated = result.updated
            sync_log.credentials_failed = result.failed
            sync_log.completed_at = timezone.now()
            sync_log.save()

        return result

    @classmethod
    def fetch_revocation_list(cls, organization):
        """
        Fetch revocation list from organization.
        
        Marks credentials as revoked if found in org's revocation list.
        
        Args:
            organization: Organization instance
        """
        if not organization.base_api_url:
            return

        url = f"{organization.base_api_url.rstrip('/')}/api/credentials/revoked/"
        headers = {}
        if organization.api_token:
            headers["Authorization"] = f"Bearer {organization.api_token}"

        try:
            timeout = getattr(settings, 'INTEGRATION_REQUEST_TIMEOUT', 10)
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(url, headers=headers)

            resp.raise_for_status()
            revoked_ids = resp.json() if isinstance(resp.json(), list) else resp.json().get("revoked", [])

            for cred_id in revoked_ids:
                try:
                    cred = Credential.objects.get(credential_id=cred_id, status="active")
                    CredentialService.update_status(cred, "revoked")
                except Credential.DoesNotExist:
                    pass

        except httpx.RequestError as e:
            logger.warning("Failed to fetch revocation list for %s: %s", organization.name, e)
