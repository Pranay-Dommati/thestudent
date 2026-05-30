import os, sys
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings
import requests

# Test file: uses OPENAI_API_KEY from environment (set in .env or Render)
headers = {
    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
}
