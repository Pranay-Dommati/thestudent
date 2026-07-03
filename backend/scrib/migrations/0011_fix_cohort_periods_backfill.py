"""Data migration: fix CohortPeriod history and re-tag User.signup_cohort.

Earlier backfill assumed Free Credit was the initial launch cohort.
In reality, Scrib launched with Cohort A (Preview), ran for ~8 months,
switched to Cohort B (Free Credit) on 2026-07-01 ~13:08 UTC (233 bonuses given),
and switched back to Cohort A (Preview) on 2026-07-02 ~20:12 UTC.

This migration reconstructs the exact 3 period windows and re-tags all users.
"""
import datetime
from django.db import migrations
from django.utils import timezone


def fix_cohort_periods_and_retag(apps, schema_editor):
    CohortPeriod = apps.get_model('scrib', 'CohortPeriod')
    User = apps.get_model('authentication', 'User')

    # Delete existing incorrect period rows
    CohortPeriod.objects.all().delete()

    first_user = User.objects.order_by('date_joined').first()
    now = timezone.now()
    history_start = first_user.date_joined if first_user else now

    # Exact boundaries of the Free Credit experiment window
    t_free_credit_start = datetime.datetime.fromisoformat('2026-07-01T13:08:00+00:00')
    t_free_credit_end   = datetime.datetime.fromisoformat('2026-07-02T20:12:38+00:00')

    # Create the 3 true historical periods:
    # 1. Preview (Launch → Jul 1 2026 13:08 UTC)
    CohortPeriod.objects.create(
        cohort='preview',
        started_at=history_start,
        ended_at=t_free_credit_start,
    )

    # 2. Free Credit (Jul 1 2026 13:08 UTC → Jul 2 2026 20:12 UTC)
    CohortPeriod.objects.create(
        cohort='free_credit',
        started_at=t_free_credit_start,
        ended_at=t_free_credit_end,
    )

    # 3. Preview (Jul 2 2026 20:12 UTC → present)
    CohortPeriod.objects.create(
        cohort='preview',
        started_at=t_free_credit_end,
        ended_at=None,
    )

    # Re-tag every single user against the corrected period timeline
    periods = list(CohortPeriod.objects.order_by('started_at'))

    batch = []
    for user in User.objects.all().iterator(chunk_size=500):
        for p in periods:
            end = p.ended_at or now
            if p.started_at <= user.date_joined <= end:
                if user.signup_cohort != p.cohort:
                    user.signup_cohort = p.cohort
                    batch.append(user)
                break

    if batch:
        for i in range(0, len(batch), 500):
            User.objects.bulk_update(batch[i:i+500], ['signup_cohort'])


def reverse_fix(apps, schema_editor):
    pass  # No reverse needed as previous backfill was inaccurate


class Migration(migrations.Migration):

    dependencies = [
        ('scrib', '0010_backfill_cohort_periods_and_user_signup_cohort'),
    ]

    operations = [
        migrations.RunPython(fix_cohort_periods_and_retag, reverse_fix),
    ]
