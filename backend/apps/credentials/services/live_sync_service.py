import logging
import uuid

import httpx
from django.utils import timezone

from apps.credentials.models import SyncLog
from apps.credentials.services.credential_service import CredentialService
from apps.credentials.utils import SyncResult

logger = logging.getLogger(__name__)

ORG_TYPE_MAP = {
    "university": {
        "path": "/university/members",
        "key": "members",
        "id_field": "membership_number",
        "credential_type": "Student Enrollment",
        "title_suffix": "Student Enrollment Certificate",
        "date_field": "enrollment_date",
    },
    "government agency": {
        "path": "/government/records",
        "key": "records",
        "id_field": "employee_id",
        "credential_type": "Civil Service Record",
        "title_suffix": "Civil Servant Certificate",
        "date_field": "start_date",
    },
    "private company": {
        "path": "/employer/employees",
        "key": "employees",
        "id_field": "employee_id",
        "credential_type": "Employment Record",
        "title_suffix": "Employment Certificate",
        "date_field": "hire_date",
    },
    "hospital": {
        "path": "/employer/employees",
        "key": "employees",
        "id_field": "employee_id",
        "credential_type": "Healthcare Employment Record",
        "title_suffix": "Healthcare Staff Certificate",
        "date_field": "hire_date",
    },
}

FALLBACK_CONFIG = {
    "path": "/university/members",
    "key": "members",
    "id_field": "membership_number",
    "credential_type": "Organizational Credential",
    "title_suffix": "Membership Certificate",
    "date_field": None,
}


class LiveSyncService:
    """
    Pull live records from the mock org API and upsert them as credentials.

    Org type → endpoint mapping (all list endpoints are public, no auth needed):
      University        → GET /university/members  → members[]
      Government Agency → GET /government/records  → records[]
      Private Company   → GET /employer/employees  → employees[]
      Hospital          → GET /employer/employees  → employees[]
    """

    @classmethod
    def sync(cls, organization) -> SyncResult:
        result = SyncResult()
        sync_log = SyncLog.objects.create(
            organization=organization,
            sync_type="manual",
            status="started",
        )

        try:
            records, cfg = cls._fetch_records(organization)
            org_name = organization.name

            for record in records:
                result.processed += 1
                try:
                    cls._upsert_credential(organization, record, cfg, org_name, result)
                except Exception as exc:
                    result.failed += 1
                    result.errors.append(str(exc))
                    logger.warning("LiveSync: failed to process record %s: %s", record, exc)

            sync_log.status = "completed"

        except Exception as exc:
            sync_log.status = "failed"
            sync_log.error_message = str(exc)
            result.errors.append(str(exc))
            logger.error("LiveSync: failed for org %s: %s", organization.name, exc)

        finally:
            sync_log.credentials_processed = result.processed
            sync_log.credentials_created = result.created
            sync_log.credentials_updated = result.updated
            sync_log.credentials_failed = result.failed
            sync_log.completed_at = timezone.now()
            sync_log.save()

        return result

    @classmethod
    def _fetch_records(cls, organization):
        org_type_name = ""
        if organization.org_type:
            org_type_name = organization.org_type.name.lower()

        cfg = ORG_TYPE_MAP.get(org_type_name, FALLBACK_CONFIG)

        base_url = organization.base_api_url
        if not base_url:
            raise ValueError(f"Organization '{organization.name}' has no base_api_url configured")

        url = f"{base_url.rstrip('/')}{cfg['path']}"

        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(url)
            resp.raise_for_status()
        except httpx.ConnectError:
            raise ConnectionError(f"Cannot connect to org API at {base_url} — is the mock org API running?")
        except httpx.TimeoutException:
            raise TimeoutError(f"Timed out fetching records from {url}")

        payload = resp.json()
        if isinstance(payload, list):
            records = payload
        else:
            records = payload.get(cfg["key"], [])

        return records, cfg

    @classmethod
    def _upsert_credential(cls, organization, record, cfg, org_name, result: SyncResult):
        from apps.credentials.models import Credential

        id_field = cfg["id_field"]
        raw_id = record.get(id_field) or record.get("national_id") or str(uuid.uuid4())
        credential_id = f"{organization.id}-{raw_id}"

        data_blob = dict(record)

        date_str = None
        if cfg["date_field"] and record.get(cfg["date_field"]):
            date_str = record[cfg["date_field"]]

        try:
            existing = Credential.objects.get(credential_id=credential_id)
            existing.data = data_blob
            existing.last_synced_at = timezone.now()
            existing.save(update_fields=["data", "last_synced_at"])
            result.updated += 1
            return existing

        except Credential.DoesNotExist:
            pass

        issued_at = None
        if date_str:
            from django.utils.dateparse import parse_date
            import datetime as dt
            parsed = parse_date(date_str)
            if parsed:
                issued_at = dt.datetime.combine(parsed, dt.time.min).replace(tzinfo=dt.timezone.utc)

        cred_data = {
            "credential_id": credential_id,
            "national_id": record.get("national_id", ""),
            "credential_type": cfg["credential_type"],
            "title": f"{org_name} — {cfg['title_suffix']}",
            "data": data_blob,
            "issued_at": issued_at,
        }
        CredentialService.save(organization, cred_data)
        result.created += 1
