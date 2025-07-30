#!/usr/bin/env python
"""
Test script to diagnose Gemini API issues
"""

import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from backend.ai.ai_service import call_gemini_api

def test_gemini_api():
    """Test the Gemini API configuration and connectivity"""
    print("=== Testing Gemini API Configuration ===\n")
    
    # Check API key
    api_key = settings.GEMINI_API_KEY
    print(f"🔑 API Key configured: {'Yes' if api_key else 'No'}")
    if api_key:
        print(f"   Key preview: {api_key[:10]}...{api_key[-10:] if len(api_key) > 20 else api_key}")
    else:
        print("❌ GEMINI_API_KEY not found in settings!")
        return
    
    # Test API connectivity with simple prompt
    print(f"\n🧪 Testing API with simple prompt...")
    
    try:
        # Simple test prompt
        test_prompt = "What is 2+2? Answer in one sentence."
        print(f"📝 Test prompt: {test_prompt}")
        
        # Make direct API call to test
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
        
        headers = {'Content-Type': 'application/json'}
        data = {
            'contents': [{
                'role': 'user',
                'parts': [{'text': test_prompt}]
            }],
            'generationConfig': {
                'temperature': 0.3,
                'topK': 20,
                'topP': 0.8,
                'maxOutputTokens': 100
            }
        }
        
        print(f"🌐 Making API request to: {api_url}")
        response = requests.post(
            f'{api_url}?key={api_key}', 
            headers=headers, 
            data=json.dumps(data),
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API call successful!")
            result = response.json()
            print(f"📝 Response preview: {str(result)[:200]}...")
            
            # Try to extract the text response
            if 'candidates' in result and len(result['candidates']) > 0:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                print(f"💬 Generated text: {text_response}")
        else:
            print(f"❌ API call failed!")
            print(f"📄 Response text: {response.text}")
            
            # Common error analysis
            if response.status_code == 400:
                print("💡 Error 400: Bad request - check API key format or request structure")
            elif response.status_code == 403:
                print("💡 Error 403: Forbidden - API key may be invalid or lacks permissions")
            elif response.status_code == 429:
                print("💡 Error 429: Rate limit exceeded - too many requests")
            elif response.status_code == 500:
                print("💡 Error 500: Internal server error - Google's API is having issues")
        
    except requests.exceptions.Timeout:
        print("❌ Request timed out - network connectivity issue")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check internet connectivity")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
    
    # Test using our AI service wrapper
    print(f"\n🔧 Testing AI service wrapper...")
    try:
        result = call_gemini_api("Hello, can you say 'API test successful'?")
        print("✅ AI service wrapper working!")
        print(f"📝 Result: {str(result)[:200]}...")
    except Exception as e:
        print(f"❌ AI service wrapper failed: {str(e)}")
    
    print(f"\n=== Gemini API Test Complete ===")

if __name__ == '__main__':
    test_gemini_api()
