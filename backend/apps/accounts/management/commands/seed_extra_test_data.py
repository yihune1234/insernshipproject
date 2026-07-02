"""
Seed additional test data for features not covered by the main seed script.
Run with: cd backend && python manage.py seed_extra_test_data

Creates:
  - DID documents + keys for holders and verifiers
  - Credential shares for holder-to-verifier sharing
  - Presentations (QR-code enabled)
  - Holder-org mappings for sync matching
  - Verification results + history
  - Platform stats for admin dashboard
  - A pending_match credential for matching workflow testing
"""

import hashlib
import json
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = "Seed extra test data: DID docs, shares, presentations, verifications, stats"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding extra test data..."))
        now = timezone.now()

        holders = list(User.objects.filter(role="holder"))
        verifiers = list(User.objects.filter(role="verifier"))
        admin = User.objects.filter(role="admin").first()

        self._seed_did_documents(holders, verifiers, now)
        self._seed_credential_shares(holders, now)
        self._seed_presentations(holders, now)
        self._seed_holder_org_mappings(holders, now)
        self._seed_verification_data(verifiers, now)
        self._seed_platform_stats(now)

        self.stdout.write(self.style.SUCCESS("  ✓ Extra test data complete"))

    # ------------------------------------------------------------------
    # DID Documents + Keys
    # ------------------------------------------------------------------

    def _seed_did_documents(self, holders, verifiers, now):
        from apps.did.models import DIDDocument, DIDKey

        all_users = holders + verifiers
        for user in all_users:
            if DIDDocument.objects.filter(owner=user).exists():
                continue

            did_str = f"did:et:{user.role}:{uuid.uuid4().hex[:12]}"
            doc = DIDDocument.objects.create(
                did=did_str,
                owner=user,
                status="active",
                document={
                    "@context": "https://www.w3.org/ns/did/v1",
                    "id": did_str,
                    "verificationMethod": [
                        {
                            "id": f"{did_str}#keys-1",
                            "type": "Ed25519VerificationKey2018",
                            "controller": did_str,
                            "publicKeyHex": hashlib.sha256(f"{did_str}-pub".encode()).hexdigest(),
                        }
                    ],
                    "authentication": [f"{did_str}#keys-1"],
                    "assertionMethod": [f"{did_str}#keys-1"],
                },
            )

            DIDKey.objects.create(
                did_document=doc,
                public_key_hex=hashlib.sha256(f"{did_str}-pub".encode()).hexdigest(),
                encrypted_private_key=hashlib.sha256(f"{did_str}-priv-secret".encode()).hexdigest(),
                key_type="Ed25519",
                purpose="authentication",
                is_active=True,
            )
            self.stdout.write(f"    DID: {did_str}  ({user.email})")

        self.stdout.write(self.style.SUCCESS("  ✓ DID documents + keys"))

    # ------------------------------------------------------------------
    # Credential Shares
    # ------------------------------------------------------------------

    def _seed_credential_shares(self, holders, now):
        from apps.credentials.models import Credential
        from apps.holder.models import CredentialShare

        for holder in holders:
            active_creds = Credential.objects.filter(holder=holder, status="active")[:2]
            if not active_creds or CredentialShare.objects.filter(holder=holder).exists():
                continue

            for cred in active_creds:
                token = hashlib.sha256(f"{cred.id}-{holder.id}-{now.timestamp()}".encode()).hexdigest()[:32]
                CredentialShare.objects.create(
                    credential=cred,
                    holder=holder,
                    token=token,
                    disclosed_claims=list(cred.data.keys())[:3] if cred.data else [],
                    expires_at=now + timedelta(hours=24),
                    is_active=True,
                    access_count=0,
                )
                self.stdout.write(f"    Share: {cred.credential_id} → token {token[:12]}...")

        self.stdout.write(self.style.SUCCESS("  ✓ Credential shares"))

    # ------------------------------------------------------------------
    # Presentations
    # ------------------------------------------------------------------

    def _seed_presentations(self, holders, now):
        from apps.holder.models import Presentation

        for holder in holders:
            if Presentation.objects.filter(holder=holder).exists():
                continue

            creds = list(holder.credentials.filter(status="active").values_list("credential_id", flat=True)[:2])
            if not creds:
                continue

            Presentation.objects.create(
                holder=holder,
                credentials=creds,
                signed_data=json.dumps({
                    "holder_did": f"did:et:holder:{uuid.uuid4().hex[:12]}",
                    "credentials": creds,
                    "signature": hashlib.sha256(json.dumps(creds).encode()).hexdigest(),
                }),
                qr_code_url=f"https://verify.credwallet.et/p/{uuid.uuid4().hex[:16]}",
                expires_at=now + timedelta(hours=1),
            )
            self.stdout.write(f"    Presentation for {holder.email}")

        self.stdout.write(self.style.SUCCESS("  ✓ Presentations"))

    # ------------------------------------------------------------------
    # Holder-Org Mappings
    # ------------------------------------------------------------------

    def _seed_holder_org_mappings(self, holders, now):
        from apps.holder.models import HolderOrgMapping
        from apps.organizations.models import Organization

        orgs = Organization.objects.filter(status="approved")[:3]
        for holder in holders[:3]:
            for org in orgs:
                if HolderOrgMapping.objects.filter(holder=holder, organization=org).exists():
                    continue
                HolderOrgMapping.objects.create(
                    holder=holder,
                    organization=org,
                    internal_id=f"INT-{org.name[:4].upper()}-{holder.id.hex[:8]}",
                    is_active=True,
                    validated_at=now - timedelta(days=15),
                    holder_national_id=getattr(holder, "national_id_verified", False)
                        and f"NID-{uuid.uuid4().hex[:10]}" or "",
                )
            self.stdout.write(f"    Org mappings for {holder.email} ({orgs.count()} orgs)")

        self.stdout.write(self.style.SUCCESS("  ✓ Holder-org mappings"))

    # ------------------------------------------------------------------
    # Verification Results + History
    # ------------------------------------------------------------------

    def _seed_verification_data(self, verifiers, now):
        from apps.credentials.models import Credential
        from apps.verification.models import VerificationHistory, VerificationResult

        active_creds = list(Credential.objects.filter(status="active")[:5])

        for i, cred in enumerate(active_creds):
            verifier = verifiers[i % len(verifiers)]

            if not VerificationResult.objects.filter(
                credential=cred, verifier=verifier
            ).exists():
                VerificationResult.objects.create(
                    credential=cred,
                    external_credential_id=cred.credential_id,
                    verifier=verifier,
                    is_valid=True,
                    checks=[
                        {"name": "Signature Verification", "passed": True, "detail": "Ed25519 signature valid"},
                        {"name": "Expiry Check", "passed": True, "detail": "Credential has not expired"},
                        {"name": "Status Check", "passed": True, "detail": f"Status is {cred.status}"},
                        {"name": "Issuer Trust", "passed": True, "detail": f"Issuer trust level verified"},
                    ],
                    overall_message="All verification checks passed — credential is valid.",
                )

            if not VerificationHistory.objects.filter(
                verifier=verifier, credential_id=cred.credential_id
            ).exists():
                VerificationHistory.objects.create(
                    verifier=verifier,
                    credential_id=cred.credential_id,
                    organization_name=cred.organization.name,
                    credential_type=cred.credential_type,
                    result=True,
                )
                self.stdout.write(f"    Verification: {cred.credential_id} by {verifier.email}")

        # One failed verification for testing error states
        failed_cred = active_creds[0] if active_creds else None
        if failed_cred and not VerificationResult.objects.filter(
            external_credential_id=f"{failed_cred.credential_id}-FAIL"
        ).exists():
            VerificationResult.objects.create(
                credential=None,
                external_credential_id=f"{failed_cred.credential_id}-ATTEMPT",
                verifier=verifiers[0],
                is_valid=False,
                checks=[
                    {"name": "Signature Verification", "passed": False, "detail": "Signature does not match"},
                    {"name": "Expiry Check", "passed": True, "detail": "Has not expired"},
                ],
                overall_message="Credential signature verification failed.",
            )
            VerificationHistory.objects.create(
                verifier=verifiers[0],
                credential_id=f"{failed_cred.credential_id}-ATTEMPT",
                organization_name=failed_cred.organization.name,
                credential_type=failed_cred.credential_type,
                result=False,
            )
            self.stdout.write(f"    Failed verification for demo purposes")

        self.stdout.write(self.style.SUCCESS("  ✓ Verification results + history"))

    # ------------------------------------------------------------------
    # Platform Stats (admin dashboard)
    # ------------------------------------------------------------------

    def _seed_platform_stats(self, now):
        from apps.admin_portal.models import PlatformStats
        from apps.credentials.models import Credential
        from apps.organizations.models import Organization
        from apps.accounts.models import CustomUser
        from apps.verification.models import VerificationHistory

        today = now.date()
        if PlatformStats.objects.filter(stat_date=today).exists():
            return

        PlatformStats.objects.create(
            stat_date=today,
            total_users=CustomUser.objects.count(),
            total_organizations=Organization.objects.count(),
            total_credentials=Credential.objects.count(),
            active_credentials=Credential.objects.filter(status="active").count(),
            total_verifications=VerificationHistory.objects.count(),
            successful_verifications=VerificationHistory.objects.filter(result=True).count(),
            new_credentials_today=Credential.objects.filter(
                created_at__date=today
            ).count(),
            sync_errors_today=0,
        )
        self.stdout.write(f"    Platform stats for {today}")
        self.stdout.write(self.style.SUCCESS("  ✓ Platform stats"))
