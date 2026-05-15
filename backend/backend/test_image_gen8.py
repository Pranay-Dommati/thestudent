import os, sys, requests, json
sys.path.append(os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings

response = requests.get(
    'https://api.openai.com/v1/models',
    headers={'Authorization': f"Bearer {settings.OPENAI_API_KEY}"}
)
models = [m['id'] for m in response.json().get('data', [])]
print("Image models available:", [m for m in models if 'dall' in m or 'image' in m])
