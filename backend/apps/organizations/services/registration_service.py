"""
Legacy multi-step organization registration service (steps 1-5).
Deprecated in favor of registration_service_v2.py which supports
Phase 5 integration field validation at registration time.
"""

import logging

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from apps.accounts.services import OTPService
from apps.organizations.models import OrgDocument, OrgRegistration, OrganizationType

logger = logging.getLogger(__name__)


class RegistrationService:
    @classmethod
    def process_step_1(cls, email, password):
        if OrgRegistration.objects.filter(email=email, status__in=["submitted", "approved"]).exists():
            raise ValueError("Email already registered")
        reg, _ = OrgRegistration.objects.update_or_create(
            email=email,
            defaults={"password_hash": make_password(password), "step": 1, "status": "draft"},
        )
        otp = OTPService.generate(purpose="org_email", identifier=email)
        return reg, otp

    @classmethod
    def process_step_1_verify(cls, registration_id, otp):
        reg = OrgRegistration.objects.get(id=registration_id)
        OTPService.verify(purpose="org_email", identifier=reg.email, submitted_otp=otp)
        reg.email_verified = True
        reg.step = 2
        reg.save(update_fields=["email_verified", "step"])
        return reg

    @classmethod
    def process_step_2(cls, registration_id, org_name, org_type_id, address, phone, website, contact_person):
        reg = OrgRegistration.objects.get(id=registration_id)
        org_type = OrganizationType.objects.get(id=org_type_id)
        reg.org_name = org_name
        reg.org_type = org_type
        reg.address = address
        reg.phone = phone
        reg.website = website
        reg.contact_person = contact_person
        reg.step = 3
        reg.save()
        return reg

    @classmethod
    def process_step_3(cls, registration_id, document_type, file, file_name):
        reg = OrgRegistration.objects.get(id=registration_id)
        OrgDocument.objects.create(
            registration=reg, document_type=document_type, file=file, file_name=file_name
        )
        reg.step = 4
        reg.save(update_fields=["step"])
        return reg

    @classmethod
    def process_step_4(cls, registration_id, use_case):
        reg = OrgRegistration.objects.get(id=registration_id)
        reg.step = 5
        reg.save(update_fields=["step"])
        return reg

    @classmethod
    def process_step_5(cls, registration_id):
        reg = OrgRegistration.objects.get(id=registration_id)
        reg.status = "submitted"
        reg.submitted_at = timezone.now()
        reg.save(update_fields=["status", "submitted_at"])
        return reg
