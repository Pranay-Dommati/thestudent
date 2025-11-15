from django.http import JsonResponse
from django.conf import settings
import json
from .ai_service import call_gemini_api

def handle_topics(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        user_input = body.get('user_input', '')
        
        prompt = f"""
You are a smart educational topic classifier AI integrated into a student learning platform.

Your task: Extract 1-5 concrete learning topics from user input.
- Focus on technical subjects, programming languages, frameworks, concepts
- Return a clean JSON array of topic names only
- Use proper capitalization and standard naming
- Return empty array [] if no learning topics found
- Expand abbreviations to full names when clear (e.g., "DSA" → "Data Structures and Algorithms")
- Return between 1 to 5 *actual learning topics* only if they exist in the input.

Examples:

Input: "I want to learn HTML and CSS"  
Output: ["HTML", "CSS"]

Input: "Please help me with machine learning and data science basics"  
Output: ["Machine Learning", "Data Science"]

Input: "I wanna be a hacker and learn something"  
Output: []

Input: "Teach me React.js, TypeScript, and Node.js"  
Output: ["React.js", "TypeScript", "Node.js"]

Input: "I need Java and DSA"  
Output: ["Java", "Data Structures and Algorithms"]

Input: "Create a course for dynamic programming"  
Output: ["Dynamic Programming"]

Now classify the user input below accordingly.

User input: "{user_input}"

Topics (JSON array only):
"""
        
        result = call_gemini_api(prompt)
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 