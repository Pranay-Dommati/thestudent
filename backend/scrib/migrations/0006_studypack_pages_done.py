from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scrib', '0005_add_share_token_to_studypack'),
    ]

    operations = [
        migrations.AddField(
            model_name='studypack',
            name='pages_done',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
