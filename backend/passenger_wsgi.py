import os
import sys

# Ensure the backend project path is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Point to Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
except Exception as e:
    # Optional: Output to a log file in case Passenger can't start
    import traceback
    log_path = os.path.join(BASE_DIR, 'passenger_wsgi_error.log')
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write('\n' + ('=' * 80) + '\n')
        f.write('Failed to initialize WSGI application:\n')
        traceback.print_exc(file=f)
    raise
