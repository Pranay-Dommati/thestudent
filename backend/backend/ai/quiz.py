from django.http import JsonResponse
from django.conf import settings
import requests
import json

def handle_quiz(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        reading_content = body.get('reading_content', '')
        
        if reading_content and len(reading_content) > 200:
            prompt = f"""
You are an expert educational assessment creator. Generate high-quality quiz questions based on the provided learning content about "{topic}".

**Source Content:**
{reading_content[:3000]}

**Requirements:**
Create 8-10 multiple-choice questions that test understanding of the content. Each question should:

**Question Format (use exactly this structure):**
QUESTION: [Question text here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation of why this answer is correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: [Specific subtopic this question covers]
CODE: [If the question references an example, code, or code analysis, include a code block in markdown triple backticks here. Otherwise, omit this line.]

**Guidelines:**
- Cover different aspects of the content evenly
- Include 3-4 beginner, 3-4 intermediate, and 2-3 advanced questions
- Test both conceptual understanding and practical application
- Avoid trick questions or ambiguous wording
- Make incorrect options plausible but clearly wrong
- Include code-related questions if the content covers programming
- If a question references an example, code, or code analysis, always include the relevant code block in markdown triple backticks in the CODE field above the question text.
- Ensure questions are directly based on the provided content
- Keep questions clear and concise
- Provide helpful explanations that reinforce learning

**Question Types to Include:**
- Definition/concept questions
- Application/scenario questions  
- Best practice questions
- Code analysis questions (if applicable)
- Comparison questions
- Problem-solving questions

Generate exactly 8-10 questions following the format above.
"""
        else:
            prompt = f"""
You are an expert educational assessment creator. Generate comprehensive quiz questions about "{topic}" for learners.

**Requirements:**
Create 8-10 multiple-choice questions that test fundamental to advanced knowledge of {topic}.

**Question Format (use exactly this structure):**
QUESTION: [Question text here]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation of why this answer is correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: [Specific subtopic this question covers]

**Guidelines:**
- Cover the most important aspects of {topic}
- Include 3-4 beginner, 3-4 intermediate, and 2-3 advanced questions
- Test both theoretical knowledge and practical understanding
- Include real-world application questions
- Make sure all options are plausible
- Focus on industry-standard knowledge and best practices
- Include questions about common use cases and implementations

**Topics to Cover:**
- Basic concepts and definitions
- Core principles and fundamentals  
- Practical applications and use cases
- Best practices and common patterns
- Advanced techniques and optimization
- Real-world scenarios and problem-solving
- Tools and ecosystem (if applicable)
- Common mistakes and troubleshooting

Generate exactly 8-10 questions following the format above.
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
        
        # Enhanced retry logic for 503/429 errors
        import time
        import random
        max_retries = 5
        
        for attempt in range(max_retries):
            try:
                print(f"🔑 Calling Gemini 1.5 Pro Quiz API (attempt {attempt + 1}/{max_retries})")
                response = requests.post(f'{GEMINI_API_URL}?key={GEMINI_API_KEY}', headers=headers, data=json.dumps(data), timeout=30)
                
                if response.status_code == 200:
                    print("✅ Gemini Quiz API call successful")
                    return JsonResponse(response.json(), safe=False)
                elif response.status_code in [429, 503]:
                    # Exponential backoff with jitter
                    base_delay = 2 ** attempt
                    jitter = random.uniform(0.5, 1.5)
                    delay = min(base_delay * jitter, 60)
                    
                    error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                    print(f"⏰ Quiz {error_type} ({response.status_code}), retrying in {delay:.1f} seconds...")
                    
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                        continue
                else:
                    print(f"❌ Quiz API error {response.status_code}: {response.text}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    
            except Exception as api_error:
                print(f"❌ Quiz API exception: {str(api_error)}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
        
        return JsonResponse({'error': f'Quiz API failed after {max_retries} attempts'}, status=503)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 