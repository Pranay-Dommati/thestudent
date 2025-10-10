from .settings import *  # noqa
import os

# Override default database to point to legacy PostgreSQL for export only
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('PG_DB', 'studentshub_db'),
        'USER': os.getenv('PG_USER', 'postgres'),
        'PASSWORD': os.getenv('PG_PASSWORD', ''),
        'HOST': os.getenv('PG_HOST', 'localhost'),
        'PORT': os.getenv('PG_PORT', '5432'),
        'CONN_MAX_AGE': 0,
    }
}
