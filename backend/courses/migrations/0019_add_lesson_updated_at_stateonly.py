# Register existing MySQL column `updated_at` for Lesson without altering DB.
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0018_add_lesson_is_deleted_stateonly'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='lesson',
                    name='updated_at',
                    field=models.DateTimeField(auto_now=True),
                ),
            ],
        ),
    ]
