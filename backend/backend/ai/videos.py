from django.http import JsonResponse
from django.conf import settings
import requests
import json

def handle_videos(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    MODEL_URLS = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    ]
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        
        prompt = f"""
You are an educational content curator specializing in finding the best learning videos. Recommend high-quality educational videos for the topic: "{topic}"

**Requirements:**
Suggest 6-8 educational videos that would be perfect for learning {topic}. For each video, provide:

**Format for each recommendation:**
Title: [Descriptive video title]
Description: [2-3 sentence description of what the video covers]
Duration: [Estimated duration in minutes]
Difficulty: [Beginner/Intermediate/Advanced]
Channel: [Suggested channel type or name style]
KeyTopics: [3-4 main topics covered]

**Guidelines:**
- Focus on reputable educational channels
- Include a mix of difficulty levels (2-3 beginner, 2-3 intermediate, 1-2 advanced)
- Prioritize comprehensive tutorials over quick tips
- Include both theoretical and practical content
- Suggest videos that complement each other
- Focus on popular, well-regarded educational content creators
- Include hands-on coding/implementation videos where applicable

**Example Format:**
Title: Complete {topic} Tutorial for Beginners
Description: A comprehensive introduction covering the fundamentals of {topic} with practical examples and real-world applications. Perfect for those starting their learning journey.
Duration: 45
Difficulty: Beginner
Channel: Tech Education Hub
KeyTopics: Basics, Setup, First Steps, Best Practices

Generate 6-8 video recommendations following this exact format.
"""
        
        headers = {'Content-Type': 'application/json'}
        data = {
            'contents': [{
                'role': 'user',
                'parts': [{'text': prompt}]
            }],
            'generationConfig': {
                'temperature': 0.4,
                'topK': 30,
                'topP': 0.9,
                'maxOutputTokens': 2048,
                'stopSequences': []
            }
        }
        
        # Enhanced retry logic for 503/429 errors
        import time
        import random
        max_retries = 5

        for model_url in MODEL_URLS:
            for attempt in range(max_retries):
                try:
                    model_name = 'gemini-2.5-flash' if '2.5-flash' in model_url else 'gemini-2.0-flash'
                    print(f"🔑 Calling {model_name} Videos API (attempt {attempt + 1}/{max_retries})")
                    response = requests.post(f'{model_url}?key={GEMINI_API_KEY}', headers=headers, data=json.dumps(data), timeout=30)

                    if response.status_code == 200:
                        print("✅ Gemini Videos API call successful")
                        return JsonResponse(response.json(), safe=False)
                    elif response.status_code in [429, 503]:
                        base_delay = 2 ** attempt
                        jitter = random.uniform(0.5, 1.5)
                        delay = min(base_delay * jitter, 30)
                        error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                        print(f"⏰ Videos {error_type} ({response.status_code}), retrying in {delay:.1f} seconds...")
                        if attempt < max_retries - 1:
                            time.sleep(delay)
                            continue
                    else:
                        print(f"❌ Videos API error {response.status_code}: {response.text}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                except Exception as api_error:
                    print(f"❌ Videos API exception: {str(api_error)}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue

            print("❌ All attempts failed for this model, trying next fallback if available...")

        return JsonResponse({'error': 'Videos API failed for both models (2.5-flash and 2.0-flash)'}, status=503)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 