"""Data migration: backfill CohortPeriod history and User.signup_cohort.

Assumptions:
  - Scrib launched with Cohort B (free_credit) active.
  - At some point the admin switched to Cohort A (preview).
  - ScribConfig.updated_at is the best-effort timestamp for that switch.
  - If there were multiple switches, CohortPeriod rows can be manually
    corrected in Django admin after this migration runs.
"""
from django.db import migrations
from django.utils import timezone


def backfill_cohort_data(apps, schema_editor):
    ScribConfig = apps.get_model('scrib', 'ScribConfig')
    CohortPeriod = apps.get_model('scrib', 'CohortPeriod')
    User = apps.get_model('authentication', 'User')

    # If CohortPeriod rows already exist, skip backfill.
    if CohortPeriod.objects.exists():
        return

    config = ScribConfig.objects.filter(pk=1).first()
    now = timezone.now()

    if config is None:
        # No config at all — create a single active preview period from epoch.
        CohortPeriod.objects.create(
            cohort='preview',
            started_at=now,
            ended_at=None,
        )
        return

    current_cohort = config.cohort           # whichever cohort is active right now
    switch_at = config.updated_at            # best-effort switch timestamp

    # Find the very first Scrib-sourced user to anchor the history start.
    first_user = User.objects.order_by('date_joined').first()
    history_start = first_user.date_joined if first_user else switch_at

    if current_cohort == 'preview':
        # Was B first, then switched to A.
        # Period 1: free_credit  (history_start → switch_at)
        # Period 2: preview      (switch_at → NULL)
        CohortPeriod.objects.create(cohort='free_credit', started_at=history_start, ended_at=switch_at)
        CohortPeriod.objects.create(cohort='preview',     started_at=switch_at,    ended_at=None)
    else:
        # Currently B — assume it was always B (single period from start).
        CohortPeriod.objects.create(cohort='free_credit', started_at=history_start, ended_at=None)

    # --- Backfill User.signup_cohort ---
    # For each user, find which period covers their date_joined and tag them.
    periods = list(CohortPeriod.objects.order_by('started_at'))

    batch = []
    for user in User.objects.filter(signup_cohort__isnull=True).iterator(chunk_size=500):
        for p in periods:
            end = p.ended_at or now
            if p.started_at <= user.date_joined <= end:
                user.signup_cohort = p.cohort
                batch.append(user)
                break

    if batch:
        # Bulk update in chunks of 500
        for i in range(0, len(batch), 500):
            User.objects.bulk_update(batch[i:i+500], ['signup_cohort'])


def reverse_backfill(apps, schema_editor):
    CohortPeriod = apps.get_model('scrib', 'CohortPeriod')
    User = apps.get_model('authentication', 'User')
    CohortPeriod.objects.all().delete()
    User.objects.all().update(signup_cohort=None)


class Migration(migrations.Migration):

    dependencies = [
        ('scrib', '0009_add_cohort_period_model'),
        ('authentication', '0010_add_signup_cohort_to_user'),
    ]

    operations = [
        migrations.RunPython(backfill_cohort_data, reverse_backfill),
    ]
