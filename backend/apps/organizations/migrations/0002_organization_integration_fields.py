# Generated migration for Phase 5 integration fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='api_token',
            field=models.TextField(blank=True, null=True, help_text='Encrypted Bearer token for calling org API'),
        ),
        migrations.AddField(
            model_name='organization',
            name='api_token_encrypted',
            field=models.BooleanField(default=False, help_text='Whether api_token is encrypted'),
        ),
        migrations.AddField(
            model_name='organization',
            name='public_key_verified_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When public key was last validated'),
        ),
        migrations.AddField(
            model_name='organization',
            name='platform_webhook_url',
            field=models.CharField(blank=True, max_length=500, null=True, help_text='Platform-generated webhook URL for org to POST revocation events to'),
        ),
        migrations.AddField(
            model_name='organization',
            name='platform_webhook_secret',
            field=models.TextField(blank=True, null=True, help_text='Platform-generated webhook secret (encrypted/hashed, shown once)'),
        ),
        migrations.AddField(
            model_name='organization',
            name='platform_webhook_secret_encrypted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='organization',
            name='api_base_url',
            field=models.URLField(blank=True, null=True, help_text="Root URL for organization's API endpoints"),
        ),
        migrations.AlterField(
            model_name='organization',
            name='public_key',
            field=models.TextField(blank=True, null=True, help_text='PEM-formatted RSA public key for signature verification'),
        ),
    ]
