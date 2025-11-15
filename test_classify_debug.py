#!/usr/bin/env python3
"""
Quick test script to debug the classify_topics endpoint directly
and see the raw AI response that's causing the 422 error.
"""

import os
import django
import sys
import json

# Add the backend directory to Python path
sys.path.insert(0, 'backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from backend.ai.views import classify_topics
from django.contrib.auth.models import AnonymousUser

def test_problematic_prompt():
    """Test the prompt that's causing 422 errors"""
    factory = RequestFactory()
    
    # The exact prompt that's failing
    test_data = {
        'query': 'i want to learn python arrays and recurstion and hash maps'
    }
    
    # Create a POST request
    request = factory.post('/ai/classify_topics/', 
                          data=json.dumps(test_data),
                          content_type='application/json')
    request.user = AnonymousUser()  # For testing without auth
    
    print("🧪 Testing classify_topics with problematic prompt...")
    print(f"Query: {test_data['query']}")
    print("-" * 60)
    
    try:
        response = classify_topics(request)
        
        print(f"Status Code: {response.status_code}")
        
        # Handle Django JsonResponse properly
        if hasattr(response, 'content'):
            try:
                if response.status_code == 401:
                    print("❌ Authentication required - this endpoint needs a valid JWT token")
                    print("Response content:", response.content.decode())
                    return
                    
                response_data = json.loads(response.content.decode())
                print(f"Response: {json.dumps(response_data, indent=2)}")
                
                # Check for debug info
                if 'raw_ai_text' in response_data:
                    print("\n🔍 Raw AI Text:")
                    print(response_data['raw_ai_text'])
                    
                if 'used_model' in response_data:
                    print(f"\n🤖 Model Used: {response_data['used_model']}")
                    
            except json.JSONDecodeError as je:
                print(f"❌ JSON decode error: {je}")
                print("Raw content:", response.content.decode())
        else:
            print("Response has no content attribute")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_problematic_prompt()