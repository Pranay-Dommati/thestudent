import os, sys, requests, json
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings

payload = {
    'model': 'dall-e-3',
    'prompt': 'A hand written note showing bubble sort',
    'n': 1,
    'size': '1024x1024'
}

response = requests.post(
    'https://api.openai.com/v1/images/generations',
    headers={'Authorization': f"Bearer {settings.OPENAI_API_KEY}"},
    json=payload
)

print(f"Status: {response.status_code}")
print("Response:", response.text)
