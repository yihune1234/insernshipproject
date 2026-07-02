# Generated migration for HolderOrgMapping model - Phase 8

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0002_organization_integration_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('holder', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='HolderOrgMapping',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('internal_id', models.CharField(help_text="Organization's internal ID for this holder", max_length=255)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this mapping is currently valid')),
                ('validated_at', models.DateTimeField(auto_now_add=True, help_text='When this holder was last validated at the organization')),
                ('validation_error', models.TextField(blank=True, help_text='Last validation error (if any)', null=True)),
                ('holder_national_id', models.CharField(blank=True, help_text="Holder's national ID used in validation", max_length=255)),
                ('holder', models.ForeignKey(help_text='The holder account (role must be \'holder\')', on_delete=django.db.models.deletion.CASCADE, related_name='org_mappings', to=settings.AUTH_USER_MODEL)),
                ('organization', models.ForeignKey(help_text="The organization this mapping is for", on_delete=django.db.models.deletion.CASCADE, related_name='holder_mappings', to='organizations.organization')),
            ],
            options={
                'db_table': 'holder_holder_org_mapping',
            },
        ),
        migrations.AddConstraint(
            model_name='holderorgmapping',
            constraint=models.UniqueConstraint(fields=['holder', 'organization'], name='unique_holder_org'),
        ),
        migrations.AddIndex(
            model_name='holderorgmapping',
            index=models.Index(fields=['holder', 'organization'], name='holder_org_idx'),
        ),
        migrations.AddIndex(
            model_name='holderorgmapping',
            index=models.Index(fields=['organization', 'is_active'], name='org_active_idx'),
        ),
    ]
