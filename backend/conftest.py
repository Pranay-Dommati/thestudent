import os

def pytest_configure():
    # Ensure Django uses PostgreSQL during tests
    os.environ.setdefault('DB_ENGINE', 'postgresql')
    os.environ.setdefault('DB_NAME', 'studentshub_db')
    os.environ.setdefault('DB_USER', 'postgres')
    os.environ.setdefault('DB_PASSWORD', 'studentshub123')
    os.environ.setdefault('DB_HOST', 'localhost')
    os.environ.setdefault('DB_PORT', '5432')
    # Optional: enable connection pooling a bit during tests
    os.environ.setdefault('DB_CONN_MAX_AGE', '0')
