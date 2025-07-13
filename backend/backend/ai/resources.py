from django.http import JsonResponse
from django.conf import settings
import requests
import json

def handle_resources(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
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
        response = requests.post(f'{GEMINI_API_URL}?key={GEMINI_API_KEY}', headers=headers, data=json.dumps(data))
        if response.status_code != 200:
            return JsonResponse({'error': f'Gemini API error: {response.status_code}'}, status=response.status_code)
        return JsonResponse(response.json(), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 