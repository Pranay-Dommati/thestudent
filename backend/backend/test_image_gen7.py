import os, sys, requests, json
sys.path.append(os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()
from django.conf import settings

payload = {
    'model': getattr(settings, 'OPENAI_IMAGE_MODEL', 'gpt-image-2'),
    'messages': [{"role":"user", "content":"Hello"}]
}
response = requests.post(
    'https://api.openai.com/v1/chat/completions',
    headers={
        'Authorization': f"Bearer {settings.OPENAI_API_KEY}",
        'Content-Type': 'application/json',
    },
    json=payload,
)
print("Status Code:", response.status_code)
print("Response text:", response.text)
