from django.http import JsonResponse
from django.conf import settings
import requests
import json

def handle_resources(request):
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
You are an expert educational content curator specializing in finding the best learning resources. Recommend high-quality educational resources for the topic: "{topic}"

**Requirements:**
Suggest 5-8 educational resources that would be perfect for learning {topic}. For each resource, provide:

**Format for each recommendation:**
Title: [Descriptive resource title]
Description: [2-3 sentence description of what the resource covers]
Type: [Documentation/Tutorial/Course/Video/Book/Article/Community/Project]
Difficulty: [Beginner/Intermediate/Advanced/All Levels]
Free: [Yes/No]
Rating: [High/Medium/Low]
URL: [Suggested URL or search term]
KeyTopics: [3-4 main topics covered]

**Guidelines:**
- Focus on reputable educational sources
- Include a mix of difficulty levels (2-3 beginner, 2-3 intermediate, 1-2 advanced)
- Prioritize comprehensive resources over quick tips
- Include both theoretical and practical content
- Suggest resources that complement each other
- Focus on popular, well-regarded educational platforms
- Include hands-on coding/implementation resources where applicable
- Mix of free and premium resources
- Include community and support resources

**Resource Types to Include:**
- Official documentation and guides
- Interactive tutorials and courses
- Video tutorials and lectures
- Books and comprehensive guides
- Community forums and support
- Practice projects and exercises
- Industry blogs and articles
- Certification programs

**Example Format:**
Title: Complete {topic} Tutorial for Beginners
Description: A comprehensive introduction covering the fundamentals of {topic} with practical examples and real-world applications. Perfect for those starting their learning journey.
Type: Tutorial
Difficulty: Beginner
Free: Yes
Rating: High
URL: https://example.com/{topic}-tutorial
KeyTopics: Basics, Setup, First Steps, Best Practices

Generate 5-8 resource recommendations following this exact format.
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

        # Try each model with retries, then fall back to next
        for model_url in MODEL_URLS:
            for attempt in range(max_retries):
                try:
                    model_name = 'gemini-2.5-flash' if '2.5-flash' in model_url else 'gemini-2.0-flash'
                    print(f"🔑 Calling {model_name} Resources API (attempt {attempt + 1}/{max_retries})")
                    response = requests.post(f'{model_url}?key={GEMINI_API_KEY}', headers=headers, data=json.dumps(data), timeout=30)

                    if response.status_code == 200:
                        print("✅ Gemini Resources API call successful")
                        return JsonResponse(response.json(), safe=False)
                    elif response.status_code in [429, 503]:
                        base_delay = 2 ** attempt
                        jitter = random.uniform(0.5, 1.5)
                        delay = min(base_delay * jitter, 30)
                        error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                        print(f"⏰ Resources {error_type} ({response.status_code}), retrying in {delay:.1f} seconds...")
                        if attempt < max_retries - 1:
                            time.sleep(delay)
                            continue
                    else:
                        print(f"❌ Resources API error {response.status_code}: {response.text}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                except Exception as api_error:
                    print(f"❌ Resources API exception: {str(api_error)}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue

            # move to next model_url
            print("❌ All attempts failed for this model, trying next fallback if available...")

        return JsonResponse({'error': 'Resources API failed for both models (2.5-flash and 2.0-flash)'}, status=503)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 