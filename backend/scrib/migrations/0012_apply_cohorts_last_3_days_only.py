"""Data migration: restrict cohort comparison tracking to the last 3 days (June 30 onwards).

Older historical signups from prior months skew the experiment comparison
since product and traffic conditions were completely different.
By setting the history start to June 30, 2026 00:00 UTC:
  - Users who joined before June 30 have signup_cohort = None (excluded from cohort stats).
  - Period 1 (Preview): June 30 00:00 UTC → July 1 13:08 UTC (~277 signups).
  - Period 2 (Free Credit): July 1 13:08 UTC → July 2 20:12 UTC (~236 signups).
  - Period 3 (Preview): July 2 20:12 UTC → present (~28 signups).
"""
import datetime
from django.db import migrations
from django.utils import timezone


def apply_last_3_days_only(apps, schema_editor):
    CohortPeriod = apps.get_model('scrib', 'CohortPeriod')
    User = apps.get_model('authentication', 'User')

    # Delete existing period rows
    CohortPeriod.objects.all().delete()

    now = timezone.now()
    history_start = datetime.datetime.fromisoformat('2026-06-30T00:00:00+00:00')
    t_free_credit_start = datetime.datetime.fromisoformat('2026-07-01T13:08:00+00:00')
    t_free_credit_end   = datetime.datetime.fromisoformat('2026-07-02T20:12:38+00:00')

    # 1. Preview (June 30 00:00 UTC → July 1 13:08 UTC)
    CohortPeriod.objects.create(
        cohort='preview',
        started_at=history_start,
        ended_at=t_free_credit_start,
    )

    # 2. Free Credit (July 1 13:08 UTC → July 2 20:12 UTC)
    CohortPeriod.objects.create(
        cohort='free_credit',
        started_at=t_free_credit_start,
        ended_at=t_free_credit_end,
    )

    # 3. Preview (July 2 20:12 UTC → present)
    CohortPeriod.objects.create(
        cohort='preview',
        started_at=t_free_credit_end,
        ended_at=None,
    )

    periods = list(CohortPeriod.objects.order_by('started_at'))

    # Reset older users before June 30 to None, and correctly tag users from June 30 onwards
    batch = []
    for user in User.objects.all().iterator(chunk_size=500):
        if user.date_joined < history_start:
            if user.signup_cohort is not None:
                user.signup_cohort = None
                batch.append(user)
        else:
            for p in periods:
                end = p.ended_at or now
                if p.started_at <= user.date_joined <= end:
                    if user.signup_cohort != p.cohort:
                        user.signup_cohort = p.cohort
                        batch.append(user)
                    break

        if len(batch) >= 500:
            User.objects.bulk_update(batch, ['signup_cohort'])
            batch = []

    if batch:
        User.objects.bulk_update(batch, ['signup_cohort'])


def reverse_apply(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('scrib', '0011_fix_cohort_periods_backfill'),
    ]

    operations = [
        migrations.RunPython(apply_last_3_days_only, reverse_apply),
    ]
