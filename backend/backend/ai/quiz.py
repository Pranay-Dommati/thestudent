from django.http import JsonResponse
from django.conf import settings
import json
import time
import random
from .ai_service import _get_vertex_client
from google.genai import types

def handle_quiz(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        reading_content = body.get('reading_content', '')
        
        if reading_content and len(reading_content) > 200:
            prompt = f"""Generate 8 quiz questions about "{topic}" based on this content:

{reading_content[:2000]}

Format each question exactly as:
QUESTION: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
EXPLANATION: [brief explanation why correct - keep under 50 words]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: {topic}

Mix difficulty: 3 beginner, 3 intermediate, 2 advanced. Test understanding and application. Keep questions clear and concise. Keep explanations brief."""
        else:
            prompt = f"""Generate 8 quiz questions about "{topic}".

Format each question exactly as:
QUESTION: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
EXPLANATION: [brief explanation why correct - keep under 50 words]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: {topic}

Mix difficulty: 3 beginner, 3 intermediate, 2 advanced. Cover key concepts, applications, and best practices. Keep questions clear and concise. Keep explanations brief."""
        
        client = _get_vertex_client()
        models = ['gemini-2.5-flash', 'gemini-2.0-flash']
        max_retries = 5

        for model_name in models:
            for attempt in range(max_retries):
                try:
                    print(f"🔑 Calling Vertex AI {model_name} Quiz API (attempt {attempt + 1}/{max_retries})")
                    
                    # On later attempts, progressively reduce output tokens and prompt slice to mitigate timeouts
                    max_output_tokens = 6144
                    if attempt >= 2:
                        max_output_tokens = 4096
                    if attempt >= 4:
                        max_output_tokens = 3072

                    # If we have reading_content, shorten the slice on later attempts
                    current_prompt = prompt
                    if 'Generate 8 quiz questions' in current_prompt and reading_content:
                        if attempt >= 2:
                            current_prompt = current_prompt.replace(reading_content[:2000], reading_content[:1200])
                        if attempt >= 4:
                            current_prompt = current_prompt.replace(reading_content[:2000], reading_content[:800])

                    response = client.models.generate_content(
                        model=model_name,
                        contents=current_prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.3,
                            top_k=20,
                            top_p=0.8,
                            max_output_tokens=max_output_tokens,
                        )
                    )

                    print(f"✅ Vertex AI Quiz API call successful via {model_name}")
                    
                    if not response.text:
                        print("⚠️ No text in Vertex AI response")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                        else:
                            return JsonResponse({
                                'error': 'Empty quiz content generated',
                                'details': 'No text returned from Vertex AI'
                            }, status=500)

                    quiz_text = response.text

                    if len(quiz_text) < 100:
                        print(f"⚠️ Quiz text too short ({len(quiz_text)} chars): {quiz_text[:200]}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                        else:
                            return JsonResponse({
                                'error': 'Generated quiz content is too short',
                                'length': len(quiz_text),
                                'preview': quiz_text[:200]
                            }, status=500)

                    # Wrap response exactly like Gemini API REST shape so the frontend doesn't break
                    # The frontend code for quizzes (if it matches scrib-frontend) often looks for response.data.candidates[0].content.parts[0].text
                    # The old quiz.py returned `JsonResponse(response_data, safe=False)`.
                    # response_data was the raw JSON from Gemini API.
                    response_data = {
                        'candidates': [
                            {
                                'content': {
                                    'parts': [{'text': quiz_text}]
                                },
                                'finishReason': 'STOP'
                            }
                        ]
                    }

                    print(f"✅ Successfully generated quiz: {len(quiz_text)} characters")
                    return JsonResponse(response_data, safe=False)

                except Exception as e:
                    # Generic error handling
                    error_msg = str(e)
                    print(f"❌ Quiz API exception: {error_msg}")
                    # Handle rate limit (429) or overloaded (503)
                    if '429' in error_msg or '503' in error_msg or 'Quota' in error_msg or 'exhausted' in error_msg.lower():
                        base_delay = 2 ** attempt
                        jitter = random.uniform(0.5, 1.5)
                        delay = min(base_delay * jitter, 30)
                        print(f"⏰ Quiz Rate limit/Overloaded, retrying in {delay:.1f} seconds...")
                        if attempt < max_retries - 1:
                            time.sleep(delay)
                            continue
                    else:
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue

            print("❌ All attempts failed for this model, trying next fallback if available...")

        return JsonResponse({'error': 'Quiz API failed for both models (2.5-flash and 2.0-flash) via Vertex AI'}, status=503)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)