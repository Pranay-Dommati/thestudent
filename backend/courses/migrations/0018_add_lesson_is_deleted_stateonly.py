# Manual migration to register existing DB column `is_deleted` on Lesson
# This uses SeparateDatabaseAndState to avoid altering a column that already exists in MySQL.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0017_prolearningsharelink'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='lesson',
                    name='is_deleted',
                    field=models.BooleanField(default=False),
                ),
            ],
        ),
    ]
