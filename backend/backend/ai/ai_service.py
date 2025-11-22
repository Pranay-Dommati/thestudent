import requests
import json
import time
import random
from django.conf import settings
from requests.exceptions import ConnectionError, Timeout, RequestException
import socket
import logging

logger = logging.getLogger('ai')

class NetworkError(Exception):
    """Custom exception for network-related errors"""
    pass

def call_gemini_api(prompt, max_retries=5):
    """Call Gemini API using 2.5-flash with fallback to 2.0-flash.

    Notes:
    - Replaces prior 1.5-pro usage.
    - Keeps retries with exponential backoff and jitter.
    """
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")

    model_urls = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    ]

    # Ensure prompt is a clean string
    if not isinstance(prompt, str):
        try:
            prompt = str(prompt)
        except Exception:
            prompt = ''

    headers = {'Content-Type': 'application/json; charset=utf-8'}
    data = {
        'contents': [{
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

    last_error = None
    for model_url in model_urls:
        for attempt in range(max_retries):
            try:
                model_name = 'gemini-2.5-flash' if '2.5-flash' in model_url else 'gemini-2.0-flash'
                print(f"🔑 Calling {model_name} (attempt {attempt + 1}/{max_retries})")

                response = requests.post(
                    f"{model_url}?key={settings.GEMINI_API_KEY}",
                    headers=headers,
                    json=data,
                    timeout=60  # Increased from 30 to 60 seconds for large content generation
                )

                if response.status_code == 200:
                    print(f"✅ {model_name} API call successful")
                    return response.json()
                elif response.status_code in [429, 503]:
                    # Exponential backoff with jitter for overload/rate limit
                    base_delay = 2 ** attempt
                    jitter = random.uniform(0.5, 1.5)
                    delay = min(base_delay * jitter, 30)
                    error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                    print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                    continue
                else:
                    snippet = (prompt[:200] + '...') if isinstance(prompt, str) and len(prompt) > 200 else prompt
                    print(f"❌ {model_name} error {response.status_code}: {response.text}\nPayload preview: {snippet}")
                    last_error = Exception(f"{model_name} returned {response.status_code}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                    continue
            except (ConnectionError, Timeout, socket.gaierror) as e:
                print(f"🌐 Network connection error: {str(e)}")
                raise NetworkError("Network connection lost. Please check your internet connection and try again.")
            except Exception as e:
                print(f"❌ Error with Gemini API: {str(e)}")
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(2)
                continue

        # try next model_url on persistent errors
        print("❌ All attempts failed for this model, trying next fallback if available...")

    # If we get here, both models failed
    raise last_error or Exception("All Gemini API attempts failed") 

def call_gemini_flash_api(prompt, max_retries=3):
    """Call Gemini Flash API using 2.5-flash with fallback to 2.0-flash (optimized for chat)."""
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")

    model_urls = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    ]

    # Ensure prompt is a clean string
    if not isinstance(prompt, str):
        try:
            prompt = str(prompt)
        except Exception:
            prompt = ''

    headers = {'Content-Type': 'application/json; charset=utf-8'}
    data = {
        'contents': [{
            'parts': [{'text': prompt}]
        }],
        'generationConfig': {
            'temperature': 0.7,
            'topK': 40,
            'topP': 0.9,
            'maxOutputTokens': 2048,
            'stopSequences': []
        }
    }

    last_error = None
    for model_url in model_urls:
        for attempt in range(max_retries):
            try:
                model_name = 'gemini-2.5-flash' if '2.5-flash' in model_url else 'gemini-2.0-flash'
                print(f"⚡ Calling {model_name} (attempt {attempt + 1}/{max_retries})")

                response = requests.post(
                    f"{model_url}?key={settings.GEMINI_API_KEY}",
                    headers=headers,
                    json=data,
                    timeout=15
                )

                if response.status_code == 200:
                    print(f"✅ {model_name} API call successful")
                    return response.json()
                elif response.status_code in [429, 503]:
                    base_delay = 1.5 ** attempt
                    jitter = random.uniform(0.8, 1.2)
                    delay = min(base_delay * jitter, 10)
                    error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                    print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                    continue
                else:
                    snippet = (prompt[:200] + '...') if isinstance(prompt, str) and len(prompt) > 200 else prompt
                    print(f"❌ {model_name} error {response.status_code}: {response.text}\nPayload preview: {snippet}")
                    last_error = Exception(f"{model_name} returned {response.status_code}")
                    if attempt < max_retries - 1:
                        time.sleep(1)
                    continue
            except (ConnectionError, Timeout, socket.gaierror) as e:
                print(f"🌐 Network connection error: {str(e)}")
                raise NetworkError("Network connection lost. Please check your internet connection and try again.")
            except Exception as e:
                print(f"❌ Error with Gemini Flash API: {str(e)}")
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(1)
                continue

        print("❌ All attempts failed for this model, trying next fallback if available...")

    raise last_error or Exception("All Gemini Flash API attempts failed") 

def call_gemini_2_5_pro_api(prompt, max_retries=3):
    """Call Gemini 2.5 Pro API with robust retries and fallback handling"""
    # Try latest model first, then fallback to regular model
    model_urls = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'
    ]

    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")

    for model_url in model_urls:
        model_name = "2.5-pro-latest" if "latest" in model_url else "2.5-pro"
        
        for attempt in range(max_retries):
            try:
                print(f"🔑 Calling Gemini {model_name} API (attempt {attempt + 1}/{max_retries})")

                headers = {'Content-Type': 'application/json'}
                data = {
                    'contents': [{
                        'role': 'user',
                        'parts': [{'text': prompt}]
                    }],
                    'generationConfig': {
                        # Use low temperature for deterministic classification
                        'temperature': 0.2,
                        'topK': 20,
                        'topP': 0.8,
                        # Topic classification needs few tokens; keep small but generous enough
                        'maxOutputTokens': 512,  # Increased for more complex responses
                        'stopSequences': []
                    }
                }

                # Longer timeout for 2.5 Pro, shorter for subsequent attempts
                timeout = 45 if attempt == 0 else 20
                
                response = requests.post(
                    f'{model_url}?key={settings.GEMINI_API_KEY}',
                    headers=headers,
                    data=json.dumps(data),
                    timeout=timeout
                )

                if response.status_code == 200:
                    print(f"✅ Gemini {model_name} API call successful")
                    return response.json()
                elif response.status_code in [429, 503]:
                    # Exponential backoff with jitter
                    base_delay = 1.5 ** attempt  # Shorter delays
                    jitter = random.uniform(0.8, 1.2)
                    delay = min(base_delay * jitter, 10)  # Cap at 10 seconds
                    error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                    print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                    continue
                elif response.status_code == 404:
                    print(f"❌ Model {model_name} not available, trying next model...")
                    break  # Try next model URL
                else:
                    print(f"❌ Gemini {model_name} API error {response.status_code}: {response.text}")
                    if attempt < max_retries - 1:
                        time.sleep(1)
                    continue

            except (ConnectionError, Timeout, socket.gaierror) as e:
                print(f"🌐 Network/timeout error with {model_name}: {str(e)}")
                if attempt < max_retries - 1:
                    print(f"⏰ Retrying in 2 seconds...")
                    time.sleep(2)
                    continue
                else:
                    print(f"❌ All attempts failed for {model_name}, trying next model...")
                    break  # Try next model
            except Exception as e:
                print(f"❌ Unexpected error with {model_name}: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    break  # Try next model

    # If all models fail, raise exception (no 1.5 Pro fallback; handled by 2.0-flash fallback above)
    raise Exception("All Gemini 2.5 Pro model variants failed")


def call_intent_classifier(user_query: str, max_retries: int = 3):
    """AI-only intent classifier: returns DIRECT or BROAD using Gemini 2.5 Flash with 2.0 Flash fallback.
    Behavior:
    - No local heuristics. Always call Gemini with a strict, compact prompt.
    - Returns a Gemini-shaped response JSON (contains 'candidates' with a parts[0].text JSON string).
    Uses GEMINI_CLASSIFIER_API_KEY if set, otherwise GEMINI_API_KEY.
    """
    # Determine which key is used (log the source, not the value)
    classifier_key = getattr(settings, 'GEMINI_CLASSIFIER_API_KEY', None)
    api_key = classifier_key or getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        raise Exception("Gemini classifier API key not configured")
    key_source = 'GEMINI_CLASSIFIER_API_KEY' if classifier_key else 'GEMINI_API_KEY'
    try:
        # Log sanitized query and key source for diagnostics
        q_snippet = (user_query or '')
        if len(q_snippet) > 120:
            q_snippet = q_snippet[:120] + '...'
        logger.info(f"Intent classifier start: key_source={key_source} query='{q_snippet}'")
    except Exception:
        pass

    # Keep the instruction ultra-compact to avoid token waste and hidden reasoning.
    intent_prompt = (
    "Return ONLY valid JSON. No explanations, no extra text, no markdown, no code fences.\n"
    "You are classifying the user's query into one of these categories:\n\n"
    "1️⃣ DIRECT → Explicit lists of **two or more distinct topics or concepts**.\n"
    "   Examples:\n"
    "   - 'arrays and recursion'\n"
    "   - 'RSA, AES, SHA-256'\n"
    "   - 'mitosis + meiosis'\n"
    "   Indicators:\n"
    "   - Contains multiple distinct subjects separated by commas, 'and', 'or', or '+'.\n"
    "   - Each part refers to a learnable concept or topic.\n\n"
    "2️⃣ BROAD → A **single general subject**, **language**, or **learning request**.\n"
    "   Examples:\n"
    "   - 'Python'\n"
    "   - 'learn calculus'\n"
    "   - 'React for beginners'\n"
    "   - 'Dutch language intermediate level'\n"
    "   Indicators:\n"
    "   - Refers to one topic only (no clear list).\n"
    "   - Often includes learning intent words: 'learn', 'beginner', 'advanced', 'course', 'tutorial'.\n\n"
    "3️⃣ NOT_STUDY → Greetings, small talk, off-topic, or unclear inputs.\n"
    "   Examples:\n"
    "   - 'hi', 'how are you', 'tell me a joke', 'what's the weather', 'can you help me'.\n"
    "   - Vague or missing a clear educational topic.\n\n"
    "Rules:\n"
    "- If the query lists multiple specific concepts separated by commas, 'and', '+', or 'or' → DIRECT.\n"
    "- If it's one clear subject or course-like request → BROAD.\n"
    "- If it's unrelated, vague, or conversational → NOT_STUDY.\n"
    "- Ignore punctuation differences, case, and stopwords when deciding.\n"
    "- If unsure but it sounds educational → default to BROAD.\n\n"
    "Output strictly one of the following JSON responses:\n"
    "- {\"intent\": \"direct\"}\n"
    "- {\"intent\": \"broad\"}\n"
    "- {\"intent\": \"not_study\", \"message\": \"🤔 I didn't quite get that. Try a short topic like 'Basics of photosynthesis' or 'Intro to networking'.\"}\n\n"
    f"User Query: \"{user_query.strip()}\""
)


    # Helper for posting to a Gemini endpoint with a specific key
    def _post_to_model(url: str, temperature: float, max_tokens: int, timeout: int = 20):
        headers = {'Content-Type': 'application/json'}
        data = {
            'contents': [{
                'parts': [{'text': intent_prompt}]
            }],
            'generationConfig': {
                'temperature': temperature,
                'topK': 1,
                'topP': 0.1,
                'maxOutputTokens': max_tokens,
                'stopSequences': [],
                # Hint the model to output raw JSON only
                'response_mime_type': 'application/json'
            }
        }
        return requests.post(f"{url}?key={api_key}", headers=headers, data=json.dumps(data), timeout=timeout)

    # Use Flash family for intent classification
    models_to_try = [
        ('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', "2.5-flash"),
        ('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', "2.0-flash"),
    ]

    for model_url, model_name in models_to_try:
        for attempt in range(max_retries):
            try:
                print(f"🧭 Calling Intent Classifier ({model_name}) attempt {attempt + 1}/{max_retries}")
                logger.info(f"Intent classifier request: model={model_name} attempt={attempt + 1}/{max_retries}")
                
                # Standard timeout for flash models
                timeout = 20

                # Keep output tiny to reduce hidden reasoning consumption; JSON-only enforced.
                r = _post_to_model(model_url, temperature=0.0, max_tokens=2000, timeout=timeout)
                if r.status_code == 200:    
                    print(f"🧭 Intent classifier success via {model_name}")
                    try:
                        data = r.json()
                        cand_count = len(data.get('candidates', [])) if isinstance(data, dict) else None
                        # Try to pull a small snippet of first text part for visibility
                        snippet = None
                        try:
                            if isinstance(data, dict) and data.get('candidates'):
                                parts_ic = data['candidates'][0].get('content', {}).get('parts', [])
                                if parts_ic:
                                    text0 = parts_ic[0].get('text')
                                    if isinstance(text0, str) and text0:
                                        snippet = text0 if len(text0) <= 200 else text0[:200] + '...'
                        except Exception:
                            snippet = None
                        logger.info(f"Intent classifier response: model={model_name} candidates={cand_count} snippet={repr(snippet) if snippet is not None else None}")
                    except Exception:
                        # If JSON parsing here fails, just return original JSON later
                        data = r.json()
                    return data
                elif r.status_code in [429, 503]:
                    # try mild backoff
                    logger.warning(f"Intent classifier backoff: status={r.status_code} model={model_name} attempt={attempt + 1}")
                    time.sleep(min(1.5 ** attempt, 8))
                    continue
                elif r.status_code == 404:
                    print(f"❌ Model {model_name} not available, trying next model...")
                    logger.warning(f"Intent classifier: model not available {model_name}")
                    break  # Try next model
                else:
                    print(f"❌ Intent classifier error {r.status_code} with {model_name}")
                    logger.error(f"Intent classifier error: status={r.status_code} model={model_name} body_len={len(r.text) if hasattr(r, 'text') else 'n/a'}")
                    if attempt < max_retries - 1:
                        time.sleep(1)
                    continue
                    
            except (ConnectionError, Timeout, socket.gaierror) as e:
                print(f"🌐 Network/timeout error with intent classifier ({model_name}): {str(e)}")
                logger.error(f"Intent classifier network/timeout: model={model_name} err={str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    print(f"❌ All attempts failed for {model_name}, trying next model...")
                    logger.error(f"Intent classifier: all attempts failed for model={model_name}")
                    break  # Try next model
            except Exception as e:
                print(f"❌ Error in intent classifier ({model_name}): {str(e)}")
                logger.error(f"Intent classifier unexpected error: model={model_name} err={str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    break  # Try next model

    raise Exception("All intent classifier attempts failed")

def call_gemini_api_stream(prompt):
    """
    Call Gemini API with streaming enabled.
    Yields chunks of text.
    """
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")

    model_urls = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse',
    ]
    
    # Ensure prompt is a clean string
    if not isinstance(prompt, str):
        try:
            prompt = str(prompt)
        except Exception:
            prompt = ''

    headers = {'Content-Type': 'application/json; charset=utf-8'}
    data = {
        'contents': [{
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

    last_error = None
    for model_url in model_urls:
        has_yielded = False  # Track if we have sent data to the client
        try:
            model_name = 'gemini-2.5-flash' if '2.5-flash' in model_url else 'gemini-2.0-flash'
            print(f"⚡ Streaming from {model_name}...")

            response = requests.post(
                f"{model_url}&key={settings.GEMINI_API_KEY}",
                headers=headers,
                json=data,
                stream=True,
                timeout=120  # Increased timeout for streaming
            )

            if response.status_code != 200:
                print(f"❌ {model_name} error {response.status_code}: {response.text}")
                last_error = Exception(f"{model_name} returned {response.status_code}")
                continue

            finish_reason_received = False
            
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data: '):
                        json_str = decoded_line[6:] # Skip 'data: '
                        try:
                            chunk_data = json.loads(json_str)
                            candidates = chunk_data.get('candidates', [])
                            if candidates:
                                parts = candidates[0].get('content', {}).get('parts', [])
                                if parts:
                                    text_chunk = parts[0].get('text', '')
                                    if text_chunk:
                                        yield text_chunk
                                        has_yielded = True
                                
                                # Check for finishReason to ensure stream completed normally
                                finish_reason = candidates[0].get('finishReason')
                                if finish_reason:
                                    if finish_reason == 'STOP':
                                        finish_reason_received = True
                                    elif finish_reason == 'MAX_TOKENS':
                                        print(f"⚠️ Stream stopped with MAX_TOKENS. Content might be truncated.")
                                        finish_reason_received = True # Accept it, but log warning
                                    else:
                                        # SAFETY, RECITATION, OTHER
                                        print(f"❌ Stream stopped with reason: {finish_reason}")
                                        # Don't set finish_reason_received = True, so it raises Exception and retries
                                    
                        except json.JSONDecodeError:
                            pass
            
            if not finish_reason_received:
                raise Exception("Stream ended unexpectedly without valid finishReason")
                
            return # Success
            
        except Exception as e:
            print(f"❌ Error streaming from {model_name}: {str(e)}")
            last_error = e
            
            # If we have already sent data to the client, we CANNOT retry transparently
            # because the client has already received the beginning of the stream.
            # Retrying would cause duplicate content (e.g. "Hello... Hello World").
            if has_yielded:
                print(f"⚠️ Cannot retry after yielding data. Aborting stream to prevent duplication.")
                raise e
                
            continue

    raise last_error or Exception("All Gemini API streaming attempts failed")