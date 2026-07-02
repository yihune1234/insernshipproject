"""
Seed test data for the Digital Credential Wallet Platform.
Run with: cd backend && python manage.py seed_test_data

This command creates:
  - Trust levels
  - Organization types
  - Admin, issuer, verifier, and holder users
  - Organizations (approved, with accreditations and integration configs)
  - NID verifications for holders
  - Wallets for holders
  - Credentials (externally-sourced copies — never created locally)
  - Held credentials, notifications, and audit log entries
"""

import hashlib
import json
import secrets
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()

PASSWORD = "TestPass123!"


class Command(BaseCommand):
    help = "Seed the database with test data for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing seed data before re-seeding",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting seed data..."))
            self._reset()

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding test data..."))
        self._seed_trust_levels()
        self._seed_org_types()
        admin = self._seed_admin()
        issuers = self._seed_issuer_users()
        verifiers = self._seed_verifier_users()
        holders = self._seed_holder_users()
        orgs = self._seed_organizations(admin, issuers)
        self._seed_accreditations(admin, orgs)
        self._seed_integration_configs(orgs)
        credentials = self._seed_credentials(orgs, holders)
        self._seed_wallets_and_held_credentials(holders, credentials)
        self._seed_verifier_api_keys(verifiers)
        self._seed_notifications(holders, credentials)
        self._seed_audit_logs(admin, holders, orgs)
        self._print_summary(admin, issuers, verifiers, holders, orgs, credentials)

    # ------------------------------------------------------------------
    # Reset
    # ------------------------------------------------------------------

    def _reset(self):
        from apps.audit.models import AuditLog
        from apps.credentials.models import Credential, CredentialOrganization, SyncLog
        from apps.holder.models import CredentialShare, HeldCredential, HolderOrgMapping, Wallet
        from apps.issuer.models import IntegrationConfig
        from apps.national_id.models import NationalIDVerification
        from apps.notifications.models import Notification, NotificationPreference
        from apps.organizations.models import Organization, OrganizationMember, OrganizationType
        from apps.trust_registry.models import Accreditation, TrustLevel
        from apps.verifier.models import VerifierAPIKey

        test_emails = [
            "admin@credwallet.et",
            "aau.issuer@credwallet.et",
            "corp.issuer@credwallet.et",
            "gov.issuer@credwallet.et",
            "hospital.issuer@credwallet.et",
            "verify1@credwallet.et",
            "verify2@credwallet.et",
            "amara.osei@holder.et",
            "kwabena.mensah@holder.et",
            "aba.ansah@holder.et",
            "kofi.asante@holder.et",
            "efua.boateng@holder.et",
        ]
        AuditLog.objects.filter(actor__email__in=test_emails).delete()
        Notification.objects.filter(recipient__email__in=test_emails).delete()
        NotificationPreference.objects.filter(user__email__in=test_emails).delete()
        CredentialShare.objects.filter(holder__email__in=test_emails).delete()
        HeldCredential.objects.filter(wallet__holder__email__in=test_emails).delete()
        Wallet.objects.filter(holder__email__in=test_emails).delete()
        HolderOrgMapping.objects.filter(holder__email__in=test_emails).delete()
        VerifierAPIKey.objects.filter(verifier__email__in=test_emails).delete()
        Credential.objects.filter(organization__name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital"
        ]).delete()
        SyncLog.objects.filter(organization__name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital"
        ]).delete()
        CredentialOrganization.objects.filter(organization__name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital"
        ]).delete()
        OrganizationMember.objects.filter(user__email__in=test_emails).delete()
        Accreditation.objects.filter(organization__name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital",
            "EduVerify Agency", "TrustCheck Corp"
        ]).delete()
        IntegrationConfig.objects.filter(organization__name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital"
        ]).delete()
        Organization.objects.filter(name__in=[
            "Addis Ababa University", "TestCorp Ltd", "Ministry of Finance", "City Hospital",
            "EduVerify Agency", "TrustCheck Corp"
        ]).delete()
        User.objects.filter(email__in=test_emails).delete()
        self.stdout.write(self.style.SUCCESS("Reset complete."))

    # ------------------------------------------------------------------
    # Trust Levels
    # ------------------------------------------------------------------

    def _seed_trust_levels(self):
        from apps.trust_registry.models import TrustLevel

        levels = [
            (1, "Basic", "Newly registered organization with minimal verification.", True, True, 50),
            (2, "Standard", "Verified organization with basic credential sync rights.", True, True, 200),
            (3, "Trusted", "Established organization with full credential sync rights.", True, True, 1000),
            (4, "High Trust", "Deeply vetted organization, high-volume syncs allowed.", True, True, 5000),
            (5, "Government / Sovereign", "Highest trust — government or sovereign authority.", True, True, None),
        ]
        for level, name, desc, can_sync, can_verify, max_creds in levels:
            TrustLevel.objects.get_or_create(
                level=level,
                defaults=dict(
                    name=name,
                    description=desc,
                    can_sync_credentials=can_sync,
                    can_receive_verifications=can_verify,
                    max_credentials_per_sync=max_creds,
                ),
            )
        self.stdout.write(self.style.SUCCESS("  ✓ Trust levels"))

    # ------------------------------------------------------------------
    # Organization Types
    # ------------------------------------------------------------------

    def _seed_org_types(self):
        from apps.organizations.models import OrganizationType

        types = [
            ("University", "Higher education institution issuing academic credentials"),
            ("Government Agency", "Government ministry or authority"),
            ("Private Company", "Corporate employer issuing employment records"),
            ("Hospital", "Healthcare institution issuing medical credentials"),
            ("Verification Agency", "Third-party credential verification provider"),
            ("Financial Institution", "Bank or financial services organization"),
        ]
        for name, desc in types:
            OrganizationType.objects.get_or_create(name=name, defaults=dict(description=desc))
        self.stdout.write(self.style.SUCCESS("  ✓ Organization types"))

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def _make_user(self, email, name, role, is_staff=False, is_verified=True, nid_verified=False):
        user, created = User.objects.get_or_create(
            email=email,
            defaults=dict(
                name=name,
                role=role,
                is_active=True,
                is_staff=is_staff,
                is_verified=is_verified,
                national_id_verified=nid_verified,
            ),
        )
        if created:
            user.set_password(PASSWORD)
            user.save()
        return user, created

    def _seed_admin(self):
        user, created = self._make_user(
            "admin@credwallet.et", "System Administrator", "admin",
            is_staff=True, is_verified=True,
        )
        if created:
            user.is_superuser = True
            user.save()
            self.stdout.write(f"    Created admin: {user.email}")
        return user

    def _seed_issuer_users(self):
        specs = [
            ("aau.issuer@credwallet.et", "AAU Admin", "issuer"),
            ("corp.issuer@credwallet.et", "TestCorp HR Admin", "issuer"),
            ("gov.issuer@credwallet.et", "Ministry Admin", "issuer"),
            ("hospital.issuer@credwallet.et", "City Hospital Admin", "issuer"),
        ]
        users = []
        for email, name, role in specs:
            u, created = self._make_user(email, name, role)
            users.append(u)
            if created:
                self.stdout.write(f"    Created issuer: {email}")
        self.stdout.write(self.style.SUCCESS("  ✓ Issuer users"))
        return users

    def _seed_verifier_users(self):
        specs = [
            ("verify1@credwallet.et", "EduVerify Inspector", "verifier"),
            ("verify2@credwallet.et", "TrustCheck Analyst", "verifier"),
        ]
        users = []
        for email, name, role in specs:
            u, created = self._make_user(email, name, role)
            users.append(u)
            if created:
                self.stdout.write(f"    Created verifier: {email}")
        self.stdout.write(self.style.SUCCESS("  ✓ Verifier users"))
        return users

    def _seed_holder_users(self):
        # NID numbers match mock_org_api data files for realistic sync
        specs = [
            ("amara.osei@holder.et", "Amara Osei", "NID-1234567890"),
            ("kwabena.mensah@holder.et", "Kwabena Mensah", "NID-0987654321"),
            ("aba.ansah@holder.et", "Aba Ansah", "NID-1111111111"),
            ("kofi.asante@holder.et", "Kofi Asante", "NID-2222222222"),
            ("efua.boateng@holder.et", "Efua Boateng", "NID-3333333333"),
        ]
        from apps.national_id.models import NationalIDVerification

        users = []
        now = timezone.now()
        for email, name, fin in specs:
            u, created = self._make_user(email, name, "holder", nid_verified=True)
            users.append(u)
            if created:
                self.stdout.write(f"    Created holder: {email}  (FIN: {fin})")
            NationalIDVerification.objects.get_or_create(
                user=u,
                defaults=dict(fin=fin, verified=True, verified_at=now - timedelta(days=30)),
            )
        self.stdout.write(self.style.SUCCESS("  ✓ Holder users + NID verifications"))
        return users

    # ------------------------------------------------------------------
    # Organizations
    # ------------------------------------------------------------------

    def _seed_organizations(self, admin, issuers):
        from apps.organizations.models import Organization, OrganizationMember, OrganizationType

        now = timezone.now()
        type_map = {t.name: t for t in OrganizationType.objects.all()}

        orgs_spec = [
            {
                "name": "Addis Ababa University",
                "type": "University",
                "email": "credentials@aau.edu.et",
                "phone": "+251111234567",
                "address": "King George VI St, Addis Ababa, Ethiopia",
                "website": "https://www.aau.edu.et",
                "contact_person": "Dr. Tadesse Bekele",
                "brand_color": "#003DA5",
                "base_api_url": "http://localhost:3001",
                "issuer": issuers[0],
            },
            {
                "name": "TestCorp Ltd",
                "type": "Private Company",
                "email": "hr@testcorp.com",
                "phone": "+251911100000",
                "address": "Bole Road, Addis Ababa, Ethiopia",
                "website": "https://www.testcorp.com",
                "contact_person": "Sarah Johnson",
                "brand_color": "#2E7D32",
                "base_api_url": "http://localhost:3001",
                "issuer": issuers[1],
            },
            {
                "name": "Ministry of Finance",
                "type": "Government Agency",
                "email": "creds@mof.gov.et",
                "phone": "+251111556677",
                "address": "Mexico Square, Addis Ababa, Ethiopia",
                "website": "https://www.mof.gov.et",
                "contact_person": "Ato Girma Tadesse",
                "brand_color": "#B71C1C",
                "base_api_url": "http://localhost:3001",
                "issuer": issuers[2],
            },
            {
                "name": "City Hospital",
                "type": "Hospital",
                "email": "records@cityhospital.et",
                "phone": "+251111223344",
                "address": "Bole Sub-City, Addis Ababa, Ethiopia",
                "website": "https://www.cityhospital.et",
                "contact_person": "Dr. Meron Haile",
                "brand_color": "#1565C0",
                "base_api_url": "http://localhost:3001",
                "issuer": issuers[3],
            },
        ]

        verifier_orgs_spec = [
            {
                "name": "EduVerify Agency",
                "type": "Verification Agency",
                "email": "ops@eduverify.et",
                "phone": "+251911200001",
                "address": "Kazanchis, Addis Ababa, Ethiopia",
                "website": "https://www.eduverify.et",
                "contact_person": "Hana Tesfaye",
                "brand_color": "#4A148C",
            },
            {
                "name": "TrustCheck Corp",
                "type": "Verification Agency",
                "email": "admin@trustcheck.et",
                "phone": "+251911200002",
                "address": "Piazza, Addis Ababa, Ethiopia",
                "website": "https://www.trustcheck.et",
                "contact_person": "Daniel Worku",
                "brand_color": "#E65100",
            },
        ]

        orgs = []
        for spec in orgs_spec:
            org, created = Organization.objects.get_or_create(
                name=spec["name"],
                defaults=dict(
                    org_type=type_map[spec["type"]],
                    status="approved",
                    email=spec["email"],
                    phone=spec["phone"],
                    address=spec["address"],
                    website=spec["website"],
                    contact_person=spec["contact_person"],
                    brand_color=spec["brand_color"],
                    base_api_url=spec.get("base_api_url", ""),
                    api_token="mock-api-token-for-development",
                    approved_by=admin,
                    approved_at=now - timedelta(days=60),
                ),
            )
            if created:
                OrganizationMember.objects.get_or_create(
                    organization=org,
                    user=spec["issuer"],
                    defaults=dict(role="owner", is_active=True),
                )
                self.stdout.write(f"    Created org: {org.name}")
            orgs.append(org)

        for spec in verifier_orgs_spec:
            org, created = Organization.objects.get_or_create(
                name=spec["name"],
                defaults=dict(
                    org_type=type_map[spec["type"]],
                    status="approved",
                    email=spec["email"],
                    phone=spec["phone"],
                    address=spec["address"],
                    website=spec["website"],
                    contact_person=spec["contact_person"],
                    brand_color=spec["brand_color"],
                    approved_by=admin,
                    approved_at=now - timedelta(days=45),
                ),
            )
            if created:
                self.stdout.write(f"    Created verifier org: {org.name}")

        self.stdout.write(self.style.SUCCESS("  ✓ Organizations"))
        return orgs

    # ------------------------------------------------------------------
    # Accreditations
    # ------------------------------------------------------------------

    def _seed_accreditations(self, admin, orgs):
        from apps.trust_registry.models import Accreditation

        now = timezone.now()
        trust_config = {
            "Addis Ababa University": (4, "0.985"),
            "TestCorp Ltd": (3, "0.872"),
            "Ministry of Finance": (5, "0.999"),
            "City Hospital": (3, "0.850"),
        }
        for org in orgs:
            level, score = trust_config.get(org.name, (2, "0.700"))
            Accreditation.objects.get_or_create(
                organization=org,
                defaults=dict(
                    status="approved",
                    trust_level=level,
                    trust_score=score,
                    expires_at=now + timedelta(days=365),
                    accredited_by=admin,
                    notes=f"Accreditation granted during platform setup. Trust level {level}.",
                ),
            )
        self.stdout.write(self.style.SUCCESS("  ✓ Trust accreditations"))

    # ------------------------------------------------------------------
    # Integration Configs
    # ------------------------------------------------------------------

    def _seed_integration_configs(self, orgs):
        from apps.issuer.models import IntegrationConfig

        now = timezone.now()
        for org in orgs:
            IntegrationConfig.objects.get_or_create(
                organization=org,
                defaults=dict(
                    sync_enabled=True,
                    sync_interval_minutes=60,
                    last_sync_at=now - timedelta(hours=2),
                    next_sync_at=now + timedelta(hours=1),
                    sync_status="success",
                    consecutive_failures=0,
                    connection_health="healthy",
                    last_health_check_at=now - timedelta(minutes=30),
                ),
            )
        self.stdout.write(self.style.SUCCESS("  ✓ Integration configs"))

    # ------------------------------------------------------------------
    # Credentials  (externally-sourced; never created locally)
    # ------------------------------------------------------------------

    def _seed_credentials(self, orgs, holders):
        from apps.credentials.models import Credential, CredentialOrganization, SyncLog

        now = timezone.now()

        # Map holder email → user object
        holder_map = {h.email: h for h in holders}

        # Simulated external sync data — mirrors mock_org_api data files.
        # All credentials originate from external organizations; this seed
        # replicates what the sync service would pull down.
        university_org = orgs[0]   # Addis Ababa University
        corp_org = orgs[1]         # TestCorp Ltd
        gov_org = orgs[2]          # Ministry of Finance
        hospital_org = orgs[3]     # City Hospital

        raw_credentials = [
            # ── University credentials ──────────────────────────────────
            {
                "credential_id": "AAU-CRED-STU-2024-001",
                "organization": university_org,
                "national_id": "NID-1234567890",
                "holder_email": "amara.osei@holder.et",
                "credential_type": "student_enrollment",
                "title": "Student Enrollment Certificate",
                "issued_at": now - timedelta(days=500),
                "expires_at": now + timedelta(days=200),
                "status": "active",
                "data": {
                    "full_name": "Amara Osei",
                    "membership_number": "STU-2024-001",
                    "programme": "Computer Science",
                    "department": "Science & Engineering",
                    "year": 3,
                    "gpa": 3.7,
                    "enrollment_date": "2022-09-01",
                    "graduation_year": 2026,
                    "status": "active",
                },
            },
            {
                "credential_id": "AAU-CRED-STU-2024-002",
                "organization": university_org,
                "national_id": "NID-0987654321",
                "holder_email": "kwabena.mensah@holder.et",
                "credential_type": "student_enrollment",
                "title": "Student Enrollment Certificate",
                "issued_at": now - timedelta(days=400),
                "expires_at": now + timedelta(days=365),
                "status": "active",
                "data": {
                    "full_name": "Kwabena Mensah",
                    "membership_number": "STU-2024-002",
                    "programme": "Electrical Engineering",
                    "department": "Science & Engineering",
                    "year": 2,
                    "gpa": 3.2,
                    "enrollment_date": "2023-09-01",
                    "graduation_year": 2027,
                    "status": "active",
                },
            },
            {
                "credential_id": "AAU-CRED-STU-2024-003",
                "organization": university_org,
                "national_id": "NID-1111111111",
                "holder_email": "aba.ansah@holder.et",
                "credential_type": "student_enrollment",
                "title": "Student Enrollment Certificate",
                "issued_at": now - timedelta(days=700),
                "expires_at": now + timedelta(days=90),
                "status": "active",
                "data": {
                    "full_name": "Aba Ansah",
                    "membership_number": "STU-2024-003",
                    "programme": "Business Administration",
                    "department": "Business School",
                    "year": 4,
                    "gpa": 3.9,
                    "enrollment_date": "2021-09-01",
                    "graduation_year": 2025,
                    "status": "active",
                },
            },
            {
                "credential_id": "AAU-CRED-STU-2023-010",
                "organization": university_org,
                "national_id": "NID-2222222222",
                "holder_email": "kofi.asante@holder.et",
                "credential_type": "student_enrollment",
                "title": "Student Enrollment Certificate",
                "issued_at": now - timedelta(days=800),
                "expires_at": now + timedelta(days=60),
                "status": "active",
                "data": {
                    "full_name": "Kofi Asante",
                    "membership_number": "STU-2023-010",
                    "programme": "Medicine",
                    "department": "Health Sciences",
                    "year": 5,
                    "gpa": 3.5,
                    "enrollment_date": "2020-09-01",
                    "graduation_year": 2025,
                    "status": "active",
                },
            },
            # ── Employment credentials (TestCorp) ────────────────────────
            {
                "credential_id": "CORP-EMP-001",
                "organization": corp_org,
                "national_id": "NID-1234567890",
                "holder_email": "amara.osei@holder.et",
                "credential_type": "employment_record",
                "title": "Employment Record",
                "issued_at": now - timedelta(days=900),
                "expires_at": None,
                "status": "active",
                "data": {
                    "full_name": "Amara Osei",
                    "employee_id": "EMP-001",
                    "department": "Engineering",
                    "job_title": "Software Engineer",
                    "level": "mid",
                    "salary_band": "B3",
                    "hire_date": "2021-03-01",
                    "office": "Addis Ababa HQ",
                    "status": "active",
                },
            },
            {
                "credential_id": "CORP-EMP-002",
                "organization": corp_org,
                "national_id": "NID-0987654321",
                "holder_email": "kwabena.mensah@holder.et",
                "credential_type": "employment_record",
                "title": "Employment Record",
                "issued_at": now - timedelta(days=1200),
                "expires_at": None,
                "status": "active",
                "data": {
                    "full_name": "Kwabena Mensah",
                    "employee_id": "EMP-002",
                    "department": "Product",
                    "job_title": "Product Manager",
                    "level": "senior",
                    "salary_band": "B4",
                    "hire_date": "2019-08-15",
                    "office": "Addis Ababa HQ",
                    "status": "active",
                },
            },
            {
                "credential_id": "CORP-EMP-003-REVOKED",
                "organization": corp_org,
                "national_id": "NID-3333333333",
                "holder_email": "efua.boateng@holder.et",
                "credential_type": "employment_record",
                "title": "Employment Record (Revoked)",
                "issued_at": now - timedelta(days=400),
                "expires_at": None,
                "status": "revoked",
                "revoked_at": now - timedelta(days=10),
                "revocation_reason": "Employee contract ended — credential revoked by issuing organization.",
                "data": {
                    "full_name": "Efua Boateng",
                    "employee_id": "EMP-099",
                    "department": "Sales",
                    "job_title": "Sales Associate",
                    "level": "junior",
                    "hire_date": "2023-01-15",
                    "office": "Accra Branch",
                    "status": "inactive",
                },
            },
            # ── Government credentials ────────────────────────────────────
            {
                "credential_id": "GOV-2024-001",
                "organization": gov_org,
                "national_id": "NID-1234567890",
                "holder_email": "amara.osei@holder.et",
                "credential_type": "employment_certificate",
                "title": "Government Employment Certificate",
                "issued_at": now - timedelta(days=1500),
                "expires_at": now + timedelta(days=730),
                "status": "active",
                "data": {
                    "full_name": "Amara Osei",
                    "record_number": "GOV-2024-001",
                    "department": "Ministry of Finance",
                    "position": "Senior Analyst",
                    "employee_id": "MF-001234",
                    "clearance_level": "standard",
                    "start_date": "2019-06-01",
                    "document_type": "employment_certificate",
                    "status": "active",
                },
            },
            {
                "credential_id": "GOV-2024-002",
                "organization": gov_org,
                "national_id": "NID-0987654321",
                "holder_email": "kwabena.mensah@holder.et",
                "credential_type": "employment_certificate",
                "title": "Government Employment Certificate",
                "issued_at": now - timedelta(days=1200),
                "expires_at": now + timedelta(days=365),
                "status": "active",
                "data": {
                    "full_name": "Kwabena Mensah",
                    "record_number": "GOV-2024-002",
                    "department": "Ministry of Health",
                    "position": "Public Health Officer",
                    "employee_id": "MH-002345",
                    "clearance_level": "standard",
                    "start_date": "2020-03-15",
                    "status": "active",
                },
            },
            # ── Hospital credentials ──────────────────────────────────────
            {
                "credential_id": "HOSP-MED-2024-001",
                "organization": hospital_org,
                "national_id": "NID-2222222222",
                "holder_email": "kofi.asante@holder.et",
                "credential_type": "medical_license",
                "title": "Medical Practitioner License",
                "issued_at": now - timedelta(days=300),
                "expires_at": now + timedelta(days=700),
                "status": "active",
                "data": {
                    "full_name": "Kofi Asante",
                    "license_number": "MED-ETH-2024-001",
                    "specialty": "General Medicine",
                    "institution": "City Hospital",
                    "issued_by": "Ethiopian Medical Board",
                    "status": "active",
                },
            },
            {
                "credential_id": "AAU-CRED-STU-2024-005-EXPIRED",
                "organization": university_org,
                "national_id": "NID-3333333333",
                "holder_email": "efua.boateng@holder.et",
                "credential_type": "student_enrollment",
                "title": "Student Enrollment Certificate (Expired)",
                "issued_at": now - timedelta(days=730),
                "expires_at": now - timedelta(days=30),
                "status": "expired",
                "data": {
                    "full_name": "Efua Boateng",
                    "membership_number": "STU-2022-050",
                    "programme": "Law",
                    "department": "Social Sciences",
                    "year": 1,
                    "gpa": 3.4,
                    "status": "completed",
                },
            },
        ]

        credentials = []
        for spec in raw_credentials:
            holder_email = spec.pop("holder_email")
            revoked_at = spec.pop("revoked_at", None)
            revocation_reason = spec.pop("revocation_reason", None)
            holder = holder_map.get(holder_email)

            cred, created = Credential.objects.get_or_create(
                credential_id=spec["credential_id"],
                defaults=dict(
                    organization=spec["organization"],
                    national_id=spec["national_id"],
                    holder=holder,
                    credential_type=spec["credential_type"],
                    title=spec["title"],
                    data=spec["data"],
                    issued_at=spec["issued_at"],
                    expires_at=spec.get("expires_at"),
                    status=spec["status"],
                    revoked_at=revoked_at,
                    revocation_reason=revocation_reason or "",
                    last_synced_at=now - timedelta(hours=2),
                    sync_source="organization_api",
                    raw_payload=json.dumps(spec["data"]),
                ),
            )
            if created:
                self.stdout.write(f"    Synced credential: {cred.credential_id}")
            credentials.append(cred)

        # CredentialOrganization stats
        for org in orgs:
            org_creds = Credential.objects.filter(organization=org)
            CredentialOrganization.objects.update_or_create(
                organization=org,
                defaults=dict(
                    credential_count=org_creds.count(),
                    last_credential_at=now - timedelta(hours=2),
                    sync_status="success",
                    last_sync_at=now - timedelta(hours=2),
                ),
            )

        # Sync log entries
        for org in orgs:
            org_cred_count = Credential.objects.filter(organization=org).count()
            if not SyncLog.objects.filter(organization=org).exists():
                SyncLog.objects.create(
                    organization=org,
                    sync_type="full",
                    status="success",
                    credentials_processed=org_cred_count,
                    credentials_created=org_cred_count,
                    credentials_updated=0,
                    credentials_failed=0,
                    started_at=now - timedelta(hours=2, minutes=5),
                    completed_at=now - timedelta(hours=2),
                )

        self.stdout.write(self.style.SUCCESS(f"  ✓ Credentials ({len(credentials)} synced from external orgs)"))
        return credentials

    # ------------------------------------------------------------------
    # Wallets & Held Credentials
    # ------------------------------------------------------------------

    def _seed_wallets_and_held_credentials(self, holders, credentials):
        from apps.holder.models import HeldCredential, Wallet

        for holder in holders:
            wallet, _ = Wallet.objects.get_or_create(
                holder=holder,
                defaults=dict(name=f"{holder.name.split()[0]}'s Wallet"),
            )
            # Add all credentials belonging to this holder
            holder_creds = [c for c in credentials if c.holder_id == holder.pk]
            for cred in holder_creds:
                HeldCredential.objects.get_or_create(
                    wallet=wallet,
                    credential=cred,
                    defaults=dict(is_pinned=cred.status == "active"),
                )
        self.stdout.write(self.style.SUCCESS("  ✓ Wallets + held credentials"))

    # ------------------------------------------------------------------
    # Verifier API Keys
    # ------------------------------------------------------------------

    def _seed_verifier_api_keys(self, verifiers):
        from apps.verifier.models import VerifierAPIKey

        for verifier in verifiers:
            if not VerifierAPIKey.objects.filter(verifier=verifier).exists():
                raw_key = secrets.token_hex(32)
                prefix = raw_key[:8]
                key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
                VerifierAPIKey.objects.create(
                    verifier=verifier,
                    name="Default API Key",
                    key_hash=key_hash,
                    prefix=prefix,
                    is_active=True,
                )
                self.stdout.write(f"    API key for {verifier.email}")
        self.stdout.write(self.style.SUCCESS("  ✓ Verifier API keys"))

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------

    def _seed_notifications(self, holders, credentials):
        from apps.notifications.models import Notification, NotificationPreference

        for holder in holders:
            NotificationPreference.objects.get_or_create(
                user=holder,
                defaults=dict(
                    credential_received=True,
                    credential_updated=True,
                    credential_revoked=True,
                    verification_complete=True,
                    sync_complete=False,
                    email_notifications=True,
                ),
            )

        holder_creds = [(c.holder, c) for c in credentials if c.holder is not None]
        for holder, cred in holder_creds:
            if not Notification.objects.filter(recipient=holder, notification_type="credential_received").exists():
                Notification.objects.create(
                    recipient=holder,
                    title="New credential added to your wallet",
                    message=(
                        f'Your credential "{cred.title}" from {cred.organization.name} '
                        f"has been synchronized to your wallet."
                    ),
                    notification_type="credential_received",
                    is_read=False,
                )

        # Revocation notification
        revoked = [c for c in credentials if c.status == "revoked" and c.holder]
        for cred in revoked:
            if not Notification.objects.filter(
                recipient=cred.holder, notification_type="credential_revoked",
            ).exists():
                Notification.objects.create(
                    recipient=cred.holder,
                    title="Credential revoked",
                    message=(
                        f'Your credential "{cred.title}" issued by {cred.organization.name} '
                        f"has been revoked by the issuing organization."
                    ),
                    notification_type="credential_revoked",
                    is_read=False,
                )

        self.stdout.write(self.style.SUCCESS("  ✓ Notifications"))

    # ------------------------------------------------------------------
    # Audit Logs
    # ------------------------------------------------------------------

    def _seed_audit_logs(self, admin, holders, orgs):
        from apps.audit.models import AuditLog

        now = timezone.now()

        # Org approval events
        for org in orgs:
            if not AuditLog.objects.filter(action="organization.approved", entity_id=str(org.id)).exists():
                AuditLog.objects.create(
                    actor=admin,
                    action="organization.approved",
                    entity_type="Organization",
                    entity_id=str(org.id),
                    metadata={"org_name": org.name, "approved_by": admin.email},
                    ip_address="127.0.0.1",
                    created_at=now - timedelta(days=60),
                )

        # Holder login events
        for holder in holders:
            if not AuditLog.objects.filter(actor=holder, action="auth.login").exists():
                AuditLog.objects.create(
                    actor=holder,
                    action="auth.login",
                    entity_type="User",
                    entity_id=str(holder.id),
                    metadata={"method": "email_password"},
                    ip_address="127.0.0.1",
                    created_at=now - timedelta(days=1),
                )

        # Credential sync events
        for org in orgs:
            if not AuditLog.objects.filter(action="credential.sync", entity_id=str(org.id)).exists():
                AuditLog.objects.create(
                    actor=admin,
                    action="credential.sync",
                    entity_type="Organization",
                    entity_id=str(org.id),
                    metadata={"org_name": org.name, "sync_type": "full", "status": "success"},
                    ip_address="127.0.0.1",
                    created_at=now - timedelta(hours=2),
                )

        self.stdout.write(self.style.SUCCESS("  ✓ Audit logs"))

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, admin, issuers, verifiers, holders, orgs, credentials):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))
        self.stdout.write(self.style.MIGRATE_HEADING("  TEST DATA SUMMARY"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))
        self.stdout.write(f"  Password for ALL accounts : {PASSWORD}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  ADMIN"))
        self.stdout.write(f"    {admin.email}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  ISSUER USERS  (manage org credential syncs)"))
        for u in issuers:
            self.stdout.write(f"    {u.email}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  VERIFIER USERS  (verify credentials)"))
        for u in verifiers:
            self.stdout.write(f"    {u.email}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  HOLDER USERS  (credential wallets)"))
        for u in holders:
            self.stdout.write(f"    {u.email}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  ORGANIZATIONS"))
        for org in orgs:
            count = len([c for c in credentials if c.organization_id == org.pk])
            self.stdout.write(f"    {org.name:30s}  ({count} synced credentials)")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  CREDENTIALS"))
        active = sum(1 for c in credentials if c.status == "active")
        revoked = sum(1 for c in credentials if c.status == "revoked")
        expired = sum(1 for c in credentials if c.status == "expired")
        self.stdout.write(f"    Total  : {len(credentials)}")
        self.stdout.write(f"    Active : {active}")
        self.stdout.write(f"    Revoked: {revoked}")
        self.stdout.write(f"    Expired: {expired}")
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("  NID NUMBERS (for identity verification testing)"))
        nid_map = [
            ("amara.osei@holder.et", "NID-1234567890"),
            ("kwabena.mensah@holder.et", "NID-0987654321"),
            ("aba.ansah@holder.et", "NID-1111111111"),
            ("kofi.asante@holder.et", "NID-2222222222"),
            ("efua.boateng@holder.et", "NID-3333333333"),
        ]
        for email, nid in nid_map:
            self.stdout.write(f"    {email:35s}  {nid}")
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60))
