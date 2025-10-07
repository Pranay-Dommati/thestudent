import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Test both models
MODEL_URLS = [
    ('gemini-2.5-flash', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'),
    ('gemini-2.0-flash', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent')
]

# Test with a simple quiz generation
prompt = """Generate 2 simple quiz questions about Python programming.

**Question Format:**
QUESTION: [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]
DIFFICULTY: Beginner
TOPIC: Python Basics
"""

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
        'maxOutputTokens': 2048,
        'stopSequences': []
    }
}

print(f"Testing Gemini API...")
print(f"API Key: {GEMINI_API_KEY[:20]}...")
print("-" * 50)

for model_name, MODEL_URL in MODEL_URLS:
    print(f"\n{'='*50}")
    print(f"Testing Model: {model_name}")
    print(f"{'='*50}")
    
    try:
        response = requests.post(
            f'{MODEL_URL}?key={GEMINI_API_KEY}', 
            headers=headers, 
            data=json.dumps(data), 
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Length: {len(response.text)} bytes")
        print("-" * 50)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('candidates'):
                candidate = result['candidates'][0]
                if candidate.get('content', {}).get('parts'):
                    text = candidate['content']['parts'][0].get('text', '')
                    print(f"Generated Content Length: {len(text)} characters")
                    print(f"Preview: {text[:200]}...")
                    print(f"\n✅ SUCCESS with {model_name}")
                else:
                    print(f"\n❌ ERROR: No parts in content for {model_name}")
                    print("Candidate:", json.dumps(candidate, indent=2)[:500])
            else:
                print(f"\n❌ ERROR: No candidates in response for {model_name}")
                print("Full response:", json.dumps(result, indent=2)[:500])
        else:
            print(f"❌ ERROR: {model_name} API returned {response.status_code}")
            print("Response:", response.text[:500])
            
    except Exception as e:
        print(f"❌ EXCEPTION with {model_name}: {e}")
