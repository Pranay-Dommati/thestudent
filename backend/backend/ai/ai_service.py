import requests
import json
import time
from django.conf import settings

# API key usage tracking for load balancing
api_key_usage = {
    'key1': {'last_used': 0, 'failures': 0, 'cooldown_until': 0},
    'key2': {'last_used': 0, 'failures': 0, 'cooldown_until': 0}
}

def select_best_gemini_key():
    """Select the best available Gemini API key based on usage and cooldowns"""
    current_time = time.time()
    MIN_INTERVAL = 5  # 5 seconds between requests per key
    COOLDOWN_TIME = 60  # 60 seconds cooldown after rate limit
    
    # Check both keys for availability
    keys = [
        {'key': settings.GEMINI_API_KEY, 'name': 'key1'},
        {'key': settings.GEMINI_API_KEY_2, 'name': 'key2'}
    ]
    
    available_keys = []
    for key_info in keys:
        key_name = key_info['name']
        usage = api_key_usage[key_name]
        
        # Check if key is available (not in cooldown and enough time passed)
        if (current_time > usage['cooldown_until'] and 
            current_time - usage['last_used'] > MIN_INTERVAL):
            available_keys.append(key_info)
    
    if not available_keys:
        # Return the key with earliest availability
        best_key = min(keys, key=lambda k: max(
            api_key_usage[k['name']]['cooldown_until'],
            api_key_usage[k['name']]['last_used'] + MIN_INTERVAL
        ))
        print(f"⚠️ All keys busy, using {best_key['name']} anyway")
        return best_key
    
    # Select key with least recent usage
    best_key = min(available_keys, key=lambda k: api_key_usage[k['name']]['last_used'])
    print(f"🔑 Selected {best_key['name']} for API call")
    return best_key

def update_key_usage(key_name, success=True, rate_limited=False):
    """Update API key usage statistics"""
    current_time = time.time()
    usage = api_key_usage[key_name]
    
    usage['last_used'] = current_time
    
    if rate_limited:
        usage['failures'] += 1
        usage['cooldown_until'] = current_time + (60 * min(usage['failures'], 5))  # Max 5 min cooldown
        print(f"⏰ {key_name} in cooldown until {time.ctime(usage['cooldown_until'])}")
    elif success:
        usage['failures'] = max(0, usage['failures'] - 0.5)  # Reduce failures on success

def call_gemini_api(prompt, max_retries=3):
    """Call Gemini API with dual key load balancing and fallback"""
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    
    if not settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY_2:
        raise Exception("No Gemini API keys configured")
    
    for attempt in range(max_retries):
        try:
            # Select best available API key
            selected_key = select_best_gemini_key()
            api_key = selected_key['key']
            key_name = selected_key['name']
            
            print(f"🔑 Using Gemini API with {key_name} (attempt {attempt + 1})")
            
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
                f'{GEMINI_API_URL}?key={api_key}', 
                headers=headers, 
                data=json.dumps(data),
                timeout=30  # Add timeout
            )
            
            if response.status_code == 200:
                update_key_usage(key_name, success=True)
                print(f"✅ Success with {key_name}")
                return response.json()
            elif response.status_code == 429:
                update_key_usage(key_name, success=False, rate_limited=True)
                print(f"⏰ Rate limit hit on {key_name}, trying different key...")
                continue  # Try next attempt with different key
            else:
                update_key_usage(key_name, success=False)
                print(f"❌ Gemini API error {response.status_code} with {key_name}")
                continue
                
        except Exception as e:
            print(f"❌ Error with Gemini API: {str(e)}")
            if 'key_name' in locals():
                update_key_usage(key_name, success=False)
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