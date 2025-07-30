#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.ai.quiz import handle_quiz
from django.http import HttpRequest
import json

# Create a mock request
request = HttpRequest()
request.method = 'POST'
request._body = json.dumps({
    'topic': 'Python',
    'reading_content': 'Python is a programming language'
}).encode('utf-8')

print("Testing quiz generation...")
response = handle_quiz(request)
print(f"Response status: {response.status_code}")
print(f"Response content: {response.content.decode('utf-8')}")
