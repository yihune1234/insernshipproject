# Generated migration for sync_source field - Phase 10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('credentials', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='credential',
            name='sync_source',
            field=models.CharField(
                choices=[
                    ('organization_api', 'Organization API (Phase 9 sync)'),
                    ('webhook', 'Organization Webhook (Phase 14 revocation)'),
                ],
                default='organization_api',
                help_text='Source of credential (Phase 10 requirement: must always be externally sourced)',
                max_length=20,
            ),
        ),
    ]
