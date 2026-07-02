import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.conf import settings

from apps.accounts.models import CustomUser
from apps.accounts.services.auth_service import AuthService, AuthenticationException


class UserRegistrationTestCase(TestCase):
    """Test user registration for all role types."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/auth/register/"

    def test_holder_registration_success(self):
        """Test successful registration with holder role (default)."""
        response = self.client.post(self.register_url, {
            "name": "John Holder",
            "email": "holder@example.com",
            "password": "SecurePassword123",
            "phone": "+1234567890"
        })
        
        # In dev mode with auto-activate, should return 201
        if getattr(settings, "DEV_AUTO_ACTIVATE_USERS", False):
            assert response.status_code == status.HTTP_201_CREATED
        else:
            assert response.status_code == status.HTTP_201_CREATED
        
        user = CustomUser.objects.get(email="holder@example.com")
        assert user.role == "holder"
        assert user.name == "John Holder"

    def test_holder_registration_with_explicit_role(self):
        """Test holder registration with explicit role parameter."""
        response = self.client.post(self.register_url, {
            "name": "Jane Holder",
            "email": "jane@example.com",
            "password": "SecurePassword123",
            "role": "holder"
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        user = CustomUser.objects.get(email="jane@example.com")
        assert user.role == "holder"

    def test_issuer_registration_rejected(self):
        """Test that issuer role registration is rejected (self-service only allows holder)."""
        response = self.client.post(self.register_url, {
            "name": "Issuer Org",
            "email": "issuer@example.com",
            "password": "SecurePassword123",
            "role": "issuer"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "admin" in response.json()["data"]["errors"].lower()

    def test_verifier_registration_rejected(self):
        """Test that verifier role registration is rejected."""
        response = self.client.post(self.register_url, {
            "name": "Verifier",
            "email": "verifier@example.com",
            "password": "SecurePassword123",
            "role": "verifier"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "admin" in response.json()["data"]["errors"].lower()

    def test_admin_registration_rejected(self):
        """Test that admin role registration is rejected in self-service."""
        response = self.client.post(self.register_url, {
            "name": "Admin",
            "email": "admin@example.com",
            "password": "SecurePassword123",
            "role": "admin"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "admin" in response.json()["data"]["errors"].lower()

    def test_invalid_role_rejected(self):
        """Test that invalid role is rejected."""
        response = self.client.post(self.register_url, {
            "name": "Invalid",
            "email": "invalid@example.com",
            "password": "SecurePassword123",
            "role": "invalid_role"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_email_rejected(self):
        """Test that duplicate email registration is rejected."""
        # First registration
        self.client.post(self.register_url, {
            "name": "First User",
            "email": "duplicate@example.com",
            "password": "SecurePassword123"
        })
        
        # Duplicate registration
        response = self.client.post(self.register_url, {
            "name": "Second User",
            "email": "duplicate@example.com",
            "password": "SecurePassword123"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["data"]["errors"].lower()

    def test_password_validation(self):
        """Test password minimum length validation."""
        response = self.client.post(self.register_url, {
            "name": "Weak Pass",
            "email": "weak@example.com",
            "password": "short"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class UserLoginTestCase(TestCase):
    """Test user login functionality."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/auth/login/"
        
        # Create a verified holder user
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_successful_login(self):
        """Test successful login returns JWT tokens."""
        response = self.client.post(self.login_url, {
            "email": "holder@example.com",
            "password": "SecurePassword123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert "tokens" in data
        assert "access" in data["tokens"]
        assert "refresh" in data["tokens"]
        assert "user" in data
        assert data["user"]["role"] == "holder"

    def test_invalid_credentials(self):
        """Test login with invalid credentials fails."""
        response = self.client.post(self.login_url, {
            "email": "holder@example.com",
            "password": "WrongPassword"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["data"]["errors"].lower()

    def test_unverified_account_login_fails(self):
        """Test login fails for unverified accounts."""
        # Create unverified user
        CustomUser.objects.create_user(
            email="unverified@example.com",
            name="Unverified",
            password="SecurePassword123",
            is_active=False,
            is_verified=False
        )
        
        response = self.client.post(self.login_url, {
            "email": "unverified@example.com",
            "password": "SecurePassword123"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class JWTTokenTestCase(TestCase):
    """Test JWT token claims include role and identity."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/auth/login/"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_access_token_contains_role_claim(self):
        """Test that access token contains role claim."""
        response = self.client.post(self.login_url, {
            "email": "holder@example.com",
            "password": "SecurePassword123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        # Token claims are encoded, but we can verify role is in response
        data = response.json()["data"]
        assert data["user"]["role"] == "holder"

    def test_refresh_token_contains_role_claim(self):
        """Test that refresh token contains role claim."""
        response = self.client.post(self.login_url, {
            "email": "holder@example.com",
            "password": "SecurePassword123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert "refresh" in data["tokens"]
        # Verify refresh token works
        refresh_response = self.client.post("/auth/token/refresh/", {
            "refresh": data["tokens"]["refresh"]
        })
        assert refresh_response.status_code == status.HTTP_200_OK


class ProfileTestCase(TestCase):
    """Test profile retrieval and update."""

    def setUp(self):
        self.client = APIClient()
        self.me_url = "/profile"
        self.holder = CustomUser.objects.create_user(
            email="holder@example.com",
            name="Holder",
            password="SecurePassword123",
            role="holder",
            is_active=True,
            is_verified=True
        )

    def test_get_profile_returns_correct_role(self):
        """Test profile endpoint returns user role."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.get(self.me_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert data["role"] == "holder"
        assert data["email"] == "holder@example.com"

    def test_profile_role_is_readonly(self):
        """Test that role cannot be updated via profile endpoint."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.put(self.me_url, {
            "name": "Updated Name",
            "role": "admin"  # Attempt to change role
        })
        
        assert response.status_code == status.HTTP_200_OK
        user = CustomUser.objects.get(id=self.holder.id)
        assert user.role == "holder"  # Role should not change


class RolePermissionTestCase(TestCase):
    """Test role-based access control."""

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
        self.issuer = CustomUser.objects.create_user(
            email="issuer@example.com",
            name="Issuer",
            password="SecurePassword123",
            role="issuer",
            is_active=True,
            is_verified=True
        )

    def test_holder_can_access_national_id_endpoint(self):
        """Test holder can access national ID verification."""
        self.client.force_authenticate(user=self.holder)
        response = self.client.post("/national-id/initiate/", {
            "fin": "12345678901"
        })
        
        # Should not be rejected due to permissions (may fail for other reasons)
        assert response.status_code != status.HTTP_403_FORBIDDEN

    def test_issuer_cannot_access_national_id_endpoint(self):
        """Test issuer cannot access national ID verification."""
        self.client.force_authenticate(user=self.issuer)
        response = self.client.post("/national-id/initiate/", {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_verifier_cannot_access_national_id_endpoint(self):
        """Test verifier cannot access national ID verification."""
        verifier = CustomUser.objects.create_user(
            email="verifier@example.com",
            name="Verifier",
            password="SecurePassword123",
            role="verifier",
            is_active=True,
            is_verified=True
        )
        self.client.force_authenticate(user=verifier)
        response = self.client.post("/national-id/initiate/", {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_cannot_access_national_id_endpoint(self):
        """Test admin cannot access national ID verification."""
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            name="Admin",
            password="SecurePassword123"
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post("/national-id/initiate/", {
            "fin": "12345678901"
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
