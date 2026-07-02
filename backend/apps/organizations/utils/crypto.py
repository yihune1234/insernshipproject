"""
Cryptographic utilities for organization public key validation.
"""

import logging
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa

logger = logging.getLogger(__name__)


class PublicKeyValidationError(Exception):
    """Raised when public key validation fails."""
    pass


class PublicKeyValidator:
    """Validates and manages RSA public keys in PEM format."""

    @staticmethod
    def validate_rsa_public_key(public_key_pem: str) -> bool:
        """
        Validate that a string is a valid PEM-formatted RSA public key.
        
        Args:
            public_key_pem: PEM-formatted RSA public key string
            
        Returns:
            True if valid
            
        Raises:
            PublicKeyValidationError: If not a valid RSA public key
        """
        if not public_key_pem:
            raise PublicKeyValidationError("Public key cannot be empty")
        
        try:
            # Try to deserialize as PEM public key
            key = serialization.load_pem_public_key(
                public_key_pem.encode() if isinstance(public_key_pem, str) else public_key_pem,
                backend=default_backend()
            )
            
            # Verify it's an RSA key
            if not isinstance(key, rsa.RSAPublicKey):
                raise PublicKeyValidationError(
                    f"Public key is not RSA format. Got {type(key).__name__}"
                )
            
            # Check minimum key size (2048 bits)
            key_size = key.key_size
            if key_size < 2048:
                raise PublicKeyValidationError(
                    f"RSA key too small: {key_size} bits. Minimum 2048 bits required."
                )
            
            return True
            
        except PublicKeyValidationError:
            raise
        except ValueError as e:
            raise PublicKeyValidationError(
                f"Invalid PEM format or malformed public key: {str(e)}"
            )
        except Exception as e:
            raise PublicKeyValidationError(
                f"Failed to validate public key: {str(e)}"
            )

    @staticmethod
    def validate_pem_format(public_key_pem: str) -> bool:
        """
        Quick validation that string looks like PEM format without full parsing.
        
        Args:
            public_key_pem: String to check
            
        Returns:
            True if appears to be PEM format
        """
        if not public_key_pem:
            return False
        
        pem_start = "-----BEGIN PUBLIC KEY-----"
        pem_end = "-----END PUBLIC KEY-----"
        
        return pem_start in public_key_pem and pem_end in public_key_pem

    @staticmethod
    def get_key_fingerprint(public_key_pem: str) -> str:
        """
        Generate SHA256 fingerprint of public key for logging/identification.
        
        Args:
            public_key_pem: PEM-formatted RSA public key
            
        Returns:
            SHA256 fingerprint as hex string
        """
        import hashlib
        
        try:
            key = serialization.load_pem_public_key(
                public_key_pem.encode() if isinstance(public_key_pem, str) else public_key_pem,
                backend=default_backend()
            )
            
            # Get DER encoding and hash it
            der_bytes = key.public_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            fingerprint = hashlib.sha256(der_bytes).hexdigest()
            return fingerprint
            
        except Exception as e:
            logger.error(f"Failed to generate key fingerprint: {e}")
            raise PublicKeyValidationError(f"Cannot generate fingerprint: {str(e)}")
