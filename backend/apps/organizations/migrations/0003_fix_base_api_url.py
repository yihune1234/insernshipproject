"""
Fix: Rename api_base_url → base_api_url to match model.
Drop and recreate fields that reference old field name.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0002_organization_integration_fields'),
    ]

    operations = [
        # Rename api_base_url → base_api_url
        migrations.RenameField(
            model_name='organization',
            old_name='api_base_url',
            new_name='base_api_url',
        ),
        # api_token was already added by 0002, keep it
        # public_key was already in 0001, keep it
        # Add missing api_token_encrypted (already in 0002)
        # public_key_verified_at already in 0002
        # platform_webhook*, platform_webhook_secret* already in 0002
        # Add approved_at from model (already in 0001)
        # No additional changes needed - field names now match model
    ]