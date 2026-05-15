import os, sys, requests, json
sys.path.append(os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings

payload = {
    'prompt': 'Test topic',
    'n': 1,
    'size': '256x256',
    'response_format': 'b64_json',
}
response = requests.post(
    'https://api.openai.com/v1/images/generations',
    headers={
        'Authorization': f"Bearer {settings.OPENAI_API_KEY}",
        'Content-Type': 'application/json',
    },
    json=payload,
)
print("Status Code:", response.status_code)
print("Response keys:", response.json().keys() if response.status_code == 200 else response.text)
