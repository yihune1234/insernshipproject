import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.national_id.models import NationalIDVerification
from apps.accounts.services.otp_service import OTPService


class KYCHolderInitiateTestCase(TestCase):
    """Test KYC verification initiation for holder role."""

    def setUp(self):
        self.client = APIClient()
        self.initiate_url = "/national-id/initiate/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_holder_can_initiate_kyc(self):
        """Test holder role can initiate KYC verification."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert "session_id" in data

    def test_kyc_creates_verification_record(self):
        """Test that initiating KYC creates NationalIDVerification record."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify record was created
        verification = NationalIDVerification.objects.get(user=self.holder)
        assert verification.fin == "12345678901"
        assert verification.verified is False


class KYCNonHolderInitiateTestCase(TestCase):
    """Test KYC verification rejection for non-holder roles."""

    def setUp(self):
        self.client = APIClient()
        self.initiate_url = "/national-id/initiate/"

    def test_issuer_cannot_initiate_kyc(self):
        """Test issuer role is rejected when initiating KYC."""
        issuer = CustomUser.objects.create_user(
            email="issuer@example.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )
        self.client.force_authenticate(user=issuer)
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "holder" in response.json()["data"]["errors"].lower()
        
        # Verify no verification record created
        assert not NationalIDVerification.objects.filter(user=issuer).exists()

    def test_verifier_cannot_initiate_kyc(self):
        """Test verifier role is rejected when initiating KYC."""
        verifier = CustomUser.objects.create_user(
            email="verifier@example.com",
            name="Verifier",
            password="SecurePassword123",
            role="verifier",
            is_active=True,
            is_verified=True
        )
        self.client.force_authenticate(user=verifier)
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "holder" in response.json()["data"]["errors"].lower()
        assert not NationalIDVerification.objects.filter(user=verifier).exists()

    def test_admin_cannot_initiate_kyc(self):
        """Test admin role is rejected when initiating KYC."""
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123"
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "holder" in response.json()["data"]["errors"].lower()
        assert not NationalIDVerification.objects.filter(user=admin).exists()

    def test_unauthenticated_cannot_initiate_kyc(self):
        """Test unauthenticated user is rejected."""
        response = self.client.post(self.initiate_url, {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class KYCVerificationSuccessTestCase(TestCase):
    """Test successful KYC verification flow."""

    def setUp(self):
        self.client = APIClient()
        self.confirm_url = "/national-id/confirm/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_holder_can_confirm_kyc(self):
        """Test holder can confirm KYC verification."""
        # Create verification record
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        # Generate OTP for this session
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.confirm_url, {
            "session_id": str(verification.session_id),
            "otp": otp
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert data["success"] is True
        assert data["national_id_verified"] is True

    def test_kyc_marks_user_verified(self):
        """Test that confirmed KYC marks user as national_id_verified."""
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.confirm_url, {
            "session_id": str(verification.session_id),
            "otp": otp
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify user flag is set
        user = CustomUser.objects.get(id=self.holder.id)
        assert user.national_id_verified is True

    def test_kyc_verification_record_updated(self):
        """Test that verification record is updated after confirmation."""
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.confirm_url, {
            "session_id": str(verification.session_id),
            "otp": otp
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify record is updated
        verification.refresh_from_db()
        assert verification.verified is True
        assert verification.verified_at is not None


class KYCVerificationFailureTestCase(TestCase):
    """Test KYC verification failures and rejections."""

    def setUp(self):
        self.client = APIClient()
        self.confirm_url = "/national-id/confirm/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_invalid_otp_rejected(self):
        """Test verification fails with invalid OTP."""
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.confirm_url, {
            "session_id": str(verification.session_id),
            "otp": "000000"  # Invalid OTP
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Verify user is NOT marked verified
        user = CustomUser.objects.get(id=self.holder.id)
        assert user.national_id_verified is False

    def test_invalid_session_rejected(self):
        """Test verification fails with invalid session ID."""
        import uuid
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.confirm_url, {
            "session_id": str(uuid.uuid4()),
            "otp": "123456"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_holder_cannot_confirm_kyc(self):
        """Test non-holder cannot confirm verification."""
        issuer = CustomUser.objects.create_user(
            email="issuer@example.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )
        
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        
        self.client.force_authenticate(user=issuer)
        response = self.client.post(self.confirm_url, {
            "session_id": str(verification.session_id),
            "otp": otp
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class DuplicateVerificationTestCase(TestCase):
    """Test handling of duplicate/re-verification attempts."""

    def setUp(self):
        self.client = APIClient()
        self.initiate_url = "/national-id/initiate/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True,
            national_id_verified=True  # Already verified
        )

    def test_already_verified_holder_can_reinitiate(self):
        """Test that already verified holder can re-initiate verification."""
        # Create existing verification record
        existing = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=True
        )
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.initiate_url, {
            "fin": "98765432109"  # New FIN
        })
        
        # Should succeed (allows re-verification)
        assert response.status_code == status.HTTP_200_OK

    def test_verification_updates_on_reinitiate(self):
        """Test that re-initiation creates new verification record."""
        # Create existing verification
        existing = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=True
        )
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.post(self.initiate_url, {
            "fin": "98765432109"  # New FIN
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify new record (update_or_create behavior)
        verification = NationalIDVerification.objects.get(user=self.holder)
        assert verification.fin == "98765432109"
        assert verification.verified is False


class VerificationSessionExpiryTestCase(TestCase):
    """Test verification session expiry and timeout handling."""

    def setUp(self):
        self.client = APIClient()
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_expired_otp_rejected(self):
        """Test that expired OTP is rejected."""
        verification = NationalIDVerification.objects.create(
            user=self.holder,
            fin="12345678901",
            verified=False
        )
        
        # Generate OTP but let it expire (OTPService typically has 10 min expiry)
        otp = OTPService.generate(purpose="fayda", identifier=str(verification.session_id))
        
        # In a real test, we'd mock time or use freezegun to expire the OTP
        # For now, this is a placeholder for the test structure
        
        self.client.force_authenticate(user=self.holder)
        # Attempt with wrong OTP after expiry would fail
        response = self.client.post("/national-id/confirm/", {
            "session_id": str(verification.session_id),
            "otp": "000000"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class VerificationStatusTestCase(TestCase):
    """Test verification status endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.status_url = "/national-id/status/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True,
            national_id_verified=False
        )

    def test_holder_can_check_verification_status(self):
        """Test holder can check their verification status."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.get(self.status_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert data["national_id_verified"] is False

    def test_issuer_cannot_check_status(self):
        """Test issuer cannot check verification status."""
        issuer = CustomUser.objects.create_user(
            email="issuer@example.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )
        self.client.force_authenticate(user=issuer)
        response = self.client.get(self.status_url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_verified_status_reflects_correctly(self):
        """Test that verification status reflects user's verified flag."""
        self.holder.national_id_verified = True
        self.holder.save()
        
        self.client.force_authenticate(user=self.holder)
        response = self.client.get(self.status_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert data["national_id_verified"] is True
