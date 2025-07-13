import requests
import json
import time
from django.conf import settings

def call_gemini_api(prompt, max_retries=2):
    """Call Gemini API with single key and fallback"""
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    for attempt in range(max_retries):
        try:
            print(f"🔑 Using Gemini API (attempt {attempt + 1})")
            
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
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print(f"⏰ Rate limit hit, waiting before retry...")
                time.sleep(2)  # Wait 2 seconds before retry
                continue
            else:
                print(f"❌ Gemini API error: {response.status_code}")
                continue
                
        except Exception as e:
            print(f"❌ Error with Gemini API: {str(e)}")
            continue
    
    # If all attempts failed, try DeepSeek fallback
    if settings.DEEPSEEK_API_KEY:
        print("🔄 Trying DeepSeek API as fallback...")
        return call_deepseek_api(prompt)
    
    raise Exception("All API attempts failed")



def call_deepseek_api(prompt):
    """Call DeepSeek API as fallback"""
    if not settings.DEEPSEEK_API_KEY:
        raise Exception("DeepSeek API key not available")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.DEEPSEEK_API_KEY}'
    }
    
    data = {
        'model': 'deepseek-chat',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.3,
        'max_tokens': 4096
    }
    
    response = requests.post(
        'https://api.deepseek.com/chat/completions',
        headers=headers,
        data=json.dumps(data)
    )
    
    if response.status_code != 200:
        raise Exception(f"DeepSeek API error: {response.status_code}")
    
    result = response.json()
    content = result['choices'][0]['message']['content']
    
    # Return in Gemini format for consistency
    return {
        'candidates': [{
            'content': {
                'parts': [{'text': content}]
            }
        }]
    } 