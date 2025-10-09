from django.http import JsonResponse
from django.conf import settings
import requests
import requests.exceptions as req_exc
import json

def handle_quiz(request):
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
        reading_content = body.get('reading_content', '')
        
        if reading_content and len(reading_content) > 200:
            # Limit reading content to 2000 chars to save tokens
            prompt = f"""Generate 8 quiz questions about "{topic}" based on this content:

{reading_content[:2000]}

Format each question exactly as:
QUESTION: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
EXPLANATION: [why correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: {topic}

Mix difficulty: 3 beginner, 3 intermediate, 2 advanced. Test understanding and application. Keep questions clear and concise."""
        else:
            prompt = f"""Generate 8 quiz questions about "{topic}".

Format each question exactly as:
QUESTION: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
EXPLANATION: [why correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: {topic}

Mix difficulty: 3 beginner, 3 intermediate, 2 advanced. Cover key concepts, applications, and best practices. Keep clear and concise."""
        
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
                'maxOutputTokens': 4096,  # start high; will reduce on later retries to avoid timeouts
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
                    print(f"🔑 Calling {model_name} Quiz API (attempt {attempt + 1}/{max_retries})")
                    # On later attempts, progressively reduce output tokens and prompt slice to mitigate timeouts
                    adjusted_data = dict(data)
                    adjusted_config = dict(adjusted_data['generationConfig'])
                    # Reduce tokens after 2nd attempt
                    if attempt >= 2:
                        adjusted_config['maxOutputTokens'] = 2048
                    if attempt >= 4:
                        adjusted_config['maxOutputTokens'] = 1536
                    adjusted_data['generationConfig'] = adjusted_config
                    # If we have reading_content, shorten the slice on later attempts
                    if 'Generate 8 quiz questions' in prompt and reading_content:
                        if attempt >= 2:
                            short_prompt = prompt.replace(reading_content[:2000], reading_content[:1200])
                            adjusted_data['contents'] = [{
                                'role': 'user',
                                'parts': [{'text': short_prompt}]
                            }]
                        if attempt >= 4:
                            shorter_prompt = prompt.replace(reading_content[:2000], reading_content[:800])
                            adjusted_data['contents'] = [{
                                'role': 'user',
                                'parts': [{'text': shorter_prompt}]
                            }]

                    # Increase timeout to reduce spurious read timeouts on larger responses
                    timeout_seconds = 60 if attempt >= 1 else 45
                    response = requests.post(
                        f'{model_url}?key={GEMINI_API_KEY}',
                        headers=headers,
                        data=json.dumps(adjusted_data),
                        timeout=timeout_seconds
                    )

                    if response.status_code == 200:
                        print("✅ Gemini Quiz API call successful")
                        response_data = response.json()
                        
                        # Check if the response contains actual content
                        if not response_data.get('candidates'):
                            print(f"⚠️ No candidates in response: {response_data}")
                            if attempt < max_retries - 1:
                                time.sleep(2)
                                continue
                            else:
                                return JsonResponse({
                                    'error': 'No quiz content generated',
                                    'details': response_data
                                }, status=500)
                        
                        # Check if content exists
                        candidate = response_data['candidates'][0]
                        finish_reason = candidate.get('finishReason', 'UNKNOWN')
                        
                        # Handle MAX_TOKENS - content was cut off
                        if finish_reason == 'MAX_TOKENS':
                            print(f"⚠️ MAX_TOKENS reached, response was truncated")
                            # On first few attempts, retry with shorter prompt
                            if attempt < max_retries - 2:
                                print(f"   Retrying with adjusted parameters (attempt {attempt + 1}/{max_retries})...")
                                time.sleep(2)
                                continue
                            # On last attempts, try to use partial content if it exists
                            if candidate.get('content', {}).get('parts'):
                                partial_text = candidate['content']['parts'][0].get('text', '')
                                if len(partial_text) > 200:
                                    print(f"⚠️ Using partial content: {len(partial_text)} characters")
                                    return JsonResponse(response_data, safe=False)
                            # If no usable partial content, return error
                            return JsonResponse({
                                'error': 'Quiz generation incomplete - content too long',
                                'details': 'The AI response was cut off. Try with a shorter topic or less reading content.',
                                'finishReason': finish_reason
                            }, status=500)
                        
                        if not candidate.get('content') or not candidate['content'].get('parts'):
                            print(f"⚠️ No content/parts in candidate: {candidate}")
                            if attempt < max_retries - 1:
                                time.sleep(2)
                                continue
                            else:
                                return JsonResponse({
                                    'error': 'Empty quiz content in response',
                                    'details': response_data
                                }, status=500)
                        
                        quiz_text = candidate['content']['parts'][0].get('text', '')
                        if not quiz_text or len(quiz_text) < 100:
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
                        
                        print(f"✅ Successfully generated quiz: {len(quiz_text)} characters")
                        return JsonResponse(response_data, safe=False)
                    elif response.status_code in [429, 503]:
                        base_delay = 2 ** attempt
                        jitter = random.uniform(0.5, 1.5)
                        delay = min(base_delay * jitter, 30)
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
                except req_exc.ReadTimeout as rt_err:
                    # Specific handling for read timeouts with exponential backoff + jitter
                    base_delay = 2 ** attempt
                    jitter = random.uniform(0.5, 1.5)
                    delay = min(base_delay * jitter, 20)
                    print(f"⏳ Quiz API ReadTimeout on {model_name} (attempt {attempt + 1}/{max_retries}), retrying in {delay:.1f}s...")
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                        continue
                except Exception as api_error:
                    print(f"❌ Quiz API exception: {str(api_error)}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue

            print("❌ All attempts failed for this model, trying next fallback if available...")

        return JsonResponse({'error': 'Quiz API failed for both models (2.5-flash and 2.0-flash)'}, status=503)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 