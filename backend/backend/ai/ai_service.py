import requests
import json
from django.conf import settings

def call_gemini_api(prompt, max_retries=3):
    """Call Gemini API with simple retry logic - using Pro model temporarily"""
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    for attempt in range(max_retries):
        try:
            print(f"🔑 Calling Gemini API (attempt {attempt + 1})")
            
            headers = {'Content-Type': 'application/json'}
            data = {
                'contents': [{
                    'role': 'user',
                    'parts': [{'text': prompt}]
                }],
                'generationConfig': {
                    'temperature': 0.3,
                    'topK': 20,
                    'topP': 0.8,
                    'maxOutputTokens': 4096,
                    'stopSequences': []
                }
            }
            
            response = requests.post(
                f'{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}', 
                headers=headers, 
                data=json.dumps(data),
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Gemini API call successful")
                return response.json()
            elif response.status_code == 429:
                print(f"⏰ Rate limit hit, retrying in 2 seconds... (attempt {attempt + 1})")
                import time
                time.sleep(2)
                continue
            else:
                print(f"❌ Gemini API error {response.status_code}: {response.text}")
                continue
                
        except Exception as e:
            print(f"❌ Error with Gemini API: {str(e)}")
            continue
    
    raise Exception("All Gemini API attempts failed") 