# Generated migration to update role choices from "organization" to "issuer"

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('holder', 'Holder'),
                    ('issuer', 'Issuer'),
                    ('verifier', 'Verifier'),
                    ('admin', 'Admin'),
                ],
                default='holder',
                max_length=20
            ),
        ),
        migrations.RunPython(
            code=migrations.RunPython.noop,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
