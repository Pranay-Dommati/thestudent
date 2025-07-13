from django.http import JsonResponse
from django.conf import settings
import requests
import json

def handle_videos(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
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
        response = requests.post(f'{GEMINI_API_URL}?key={GEMINI_API_KEY}', headers=headers, data=json.dumps(data))
        if response.status_code != 200:
            return JsonResponse({'error': f'Gemini API error: {response.status_code}'}, status=response.status_code)
        return JsonResponse(response.json(), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 