#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from backend.ai.views import classify_topics
from django.http import HttpRequest
import json

def test_enhanced_classification():
    # Create a mock request for direct classification
    request = HttpRequest()
    request.method = 'POST'
    request._body = json.dumps({'query': 'arrays', 'intent': 'direct'}).encode()

    try:
        print('Testing direct classification with enhanced timeouts...')
        response = classify_topics(request)
        response_data = json.loads(response.content)
        print(f'Status: {response.status_code}')
        print(f'Topics: {response_data.get("topics", [])}')
        print(f'Debug: {response_data.get("debug_meta", {})}')
        return True
    except Exception as e:
        print(f'Error: {str(e)}')
        return False

if __name__ == '__main__':
    success = test_enhanced_classification()
    print(f'Test result: {"PASS" if success else "FAIL"}')