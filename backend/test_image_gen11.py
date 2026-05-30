import os, sys
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings
import requests

response = requests.post(
    'https://api.openai.com/v1/images/generations',
    headers={'Authorization': f"Bearer {settings.OPENAI_API_KEY}"},
    json={
        'prompt': 'A testing prompt',
        'model': 'gpt-image-2',
        'n': 1,
        'size': '1024x1024'
    }
)
print(f"Status: {response.status_code}")
print("Response:", response.text)
