import logging
import secrets

from django.utils import timezone

from apps.did.services import DIDService
from apps.organizations.models import Organization, OrganizationMember, OrgRegistration

logger = logging.getLogger(__name__)


class OnboardingService:
    @classmethod
    def approve_registration(cls, registration: OrgRegistration, reviewer):
        from apps.accounts.models import CustomUser
        password = secrets.token_urlsafe(16)
        user = CustomUser.objects.create_user(
            email=registration.email,
            name=registration.org_name,
            password=password,
            role="issuer",  # Changed from "organization" to align with Phase 2
            is_active=True,
            is_verified=True,
        )
        org = Organization.objects.create(
            name=registration.org_name,
            org_type=registration.org_type,
            email=registration.email,
            phone=registration.phone,
            address=registration.address,
            website=registration.website,
            contact_person=registration.contact_person,
            status="approved",
            approved_by=reviewer,
            approved_at=timezone.now(),
        )
        try:
            did_doc = DIDService.create_for_user(user)
            org.did = did_doc
            org.save(update_fields=["did"])
        except Exception as e:
            logger.warning("Failed to create DID for org %s: %s", org.name, e)
        OrganizationMember.objects.create(organization=org, user=user, role="owner")
        registration.status = "approved"
        registration.reviewed_by = reviewer
        registration.reviewed_at = timezone.now()
        registration.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        return org, user
