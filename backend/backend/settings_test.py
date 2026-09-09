"""Settings for running the Django test suite.

Two things stop `manage.py test` working against the configured database: the
production MySQL user has no permission to create `test_*` databases, and some
historical migrations carry MySQL-only raw SQL that SQLite rejects.

This module points Django at an in-memory SQLite database and builds the schema
directly from the models instead of replaying migrations, so tests exercise the
current model definitions without needing database privileges.

    python manage.py test scrib.tests_packs --settings=backend.settings_test
"""

from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


class _SkipMigrations:
    """Tell Django every app has no migrations, so tables come from the models."""

    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = _SkipMigrations()

# Fast, deterministic tests.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Throttling and the in-flight lock both live in the cache and would make tests
# order-dependent. Use a throwaway in-process cache and lift the rate ceilings;
# the throttle/lock behaviour has its own dedicated tests that opt back in.
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
REST_FRAMEWORK = {**REST_FRAMEWORK, 'DEFAULT_THROTTLE_RATES': {
    **REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {}),
    'yt_organize_anon': '10000/hour',
    'yt_organize_anon_day': '10000/day',
    'yt_organize_user': '10000/hour',
}}
