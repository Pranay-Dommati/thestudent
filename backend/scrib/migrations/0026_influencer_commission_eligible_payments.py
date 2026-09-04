# Generated for configurable influencer commission-eligible payment count

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scrib', '0025_alter_influencerreferral_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='influencer',
            name='commission_eligible_payments',
            field=models.PositiveSmallIntegerField(
                default=2,
                help_text=(
                    "How many of a referred user's successful payments earn commission, "
                    "counted from their first payment. e.g. 2 = only the user's 1st and 2nd "
                    "payments. 0 disables commissions for this influencer."
                ),
            ),
        ),
        migrations.AlterField(
            model_name='influencer',
            name='commission_rate',
            field=models.DecimalField(
                decimal_places=2, default=10.0, max_digits=5,
                help_text='Percent of each qualifying payment paid to this influencer',
            ),
        ),
    ]
