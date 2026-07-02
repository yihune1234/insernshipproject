import re

from django.core.exceptions import ValidationError


def validate_phone(value):
    pattern = r"^\+?[1-9]\d{1,14}$"
    if not re.match(pattern, value):
        raise ValidationError("Invalid phone number format.")


def validate_hex_key(value, length=64):
    if not re.match(r"^[0-9a-fA-F]+$", value) or len(value) != length:
        raise ValidationError(f"Must be a {length}-character hex string.")
