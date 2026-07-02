# Generated migration for Phase 6 accreditation updates

from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):

    dependencies = [
        ('trust_registry', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='accreditation',
            name='issued_at',
            field=models.DateTimeField(auto_now_add=True, default=timezone.now, help_text='When accreditation was issued'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='accreditation',
            name='revocation_reason',
            field=models.TextField(blank=True, help_text='Reason for revocation or suspension (if applicable)'),
        ),
        migrations.AlterField(
            model_name='accreditation',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When accreditation expires (null = no expiry)'),
        ),
        migrations.AlterField(
            model_name='accreditation',
            name='notes',
            field=models.TextField(blank=True, help_text='Admin notes about this accreditation'),
        ),
        migrations.AlterField(
            model_name='accreditation',
            name='trust_level',
            field=models.IntegerField(default=1, help_text='Trust level 1-5'),
        ),
        migrations.AlterField(
            model_name='accreditation',
            name='trust_score',
            field=models.DecimalField(decimal_places=3, default=0, help_text='Trust score 0.000-1.000', max_digits=4),
        ),
    ]
