import os
import json
import tempfile
import logging
from google import genai
from google.genai import types
from django.conf import settings

logger = logging.getLogger('ai')

class NetworkError(Exception):
    """Custom exception for network-related errors"""
    pass

def _setup_credentials():
    """
    Set up Google Application Credentials for Vertex AI.
    """
    service_account_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if service_account_json:
        try:
            json.loads(service_account_json)
            tmp = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json")
            tmp.write(service_account_json)
            tmp.flush()
            tmp.close()
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = tmp.name
            logger.info("[COURSES AI] Credentials loaded from GOOGLE_SERVICE_ACCOUNT_JSON env var")
            return
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"[COURSES AI] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
            raise

    key_path = os.path.join(settings.BASE_DIR, 'easylearnova-5a2456bf394b.json')
    if os.path.exists(key_path):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
        logger.info(f"[COURSES AI] Credentials loaded from local file: {os.path.basename(key_path)}")
        return

    raise RuntimeError(
        "No Google credentials found. "
        "Set GOOGLE_SERVICE_ACCOUNT_JSON env var or place JSON key in backend dir."
    )

def _get_vertex_client():
    _setup_credentials()
    return genai.Client(
        vertexai=True,
        project="easylearnova",
        location="us-central1"
    )

def _mock_gemini_response(text):
    """Wraps Vertex AI text response in the REST API dictionary format expected by views.py"""
    return {
        'candidates': [
            {
                'content': {
                    'parts': [{'text': text}]
                }
            }
        ]
    }

def call_gemini_api(prompt, max_retries=5):
    """Call Vertex AI using gemini-2.5-flash with fallback to 2.0-flash."""
    if not isinstance(prompt, str):
        try: prompt = str(prompt)
        except Exception: prompt = ''

    client = _get_vertex_client()
    models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None
    
    for model_name in models:
        for attempt in range(max_retries):
            try:
                print(f"🔑 Calling Vertex AI {model_name} (attempt {attempt + 1}/{max_retries})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        top_k=20,
                        top_p=0.8,
                        max_output_tokens=4096,
                    )
                )
                print(f"✅ {model_name} API call successful")
                return _mock_gemini_response(response.text)
            except Exception as e:
                print(f"❌ {model_name} error: {e}")
                last_error = e
                import time
                time.sleep(1)
        print("❌ All attempts failed for this model, trying next fallback if available...")
        
    raise last_error or Exception("All Vertex AI attempts failed")

def call_gemini_flash_api(prompt, max_retries=3):
    """Call Vertex AI using 2.5-flash with fallback to 2.0-flash (optimized for chat)."""
    if not isinstance(prompt, str):
        try: prompt = str(prompt)
        except Exception: prompt = ''

    client = _get_vertex_client()
    models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None
    
    for model_name in models:
        for attempt in range(max_retries):
            try:
                print(f"⚡ Calling Vertex AI {model_name} (attempt {attempt + 1}/{max_retries})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.7,
                        top_k=40,
                        top_p=0.9,
                        max_output_tokens=2048,
                    )
                )
                print(f"✅ {model_name} API call successful")
                return _mock_gemini_response(response.text)
            except Exception as e:
                print(f"❌ Error with Vertex AI Flash API: {e}")
                last_error = e
                import time
                time.sleep(1)
        print("❌ All attempts failed for this model, trying next fallback if available...")
        
    raise last_error or Exception("All Vertex AI Flash API attempts failed")

def call_gemini_2_5_pro_api(prompt, max_retries=3):
    """Call Vertex AI 2.5 Pro API with robust retries and fallback handling"""
    client = _get_vertex_client()
    # Vertex AI models:
    models = ['gemini-2.5-pro', 'gemini-2.0-pro-exp-02-05']
    last_error = None
    
    for model_name in models:
        for attempt in range(max_retries):
            try:
                print(f"🔑 Calling Vertex AI {model_name} (attempt {attempt + 1}/{max_retries})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        top_k=20,
                        top_p=0.8,
                        max_output_tokens=512,
                    )
                )
                print(f"✅ Vertex AI {model_name} API call successful")
                return _mock_gemini_response(response.text)
            except Exception as e:
                print(f"❌ Unexpected error with {model_name}: {e}")
                last_error = e
                import time
                time.sleep(1)
                
    raise last_error or Exception("All Vertex AI Pro model variants failed")

def call_intent_classifier(user_query: str, max_retries: int = 3):
    """AI-only intent classifier: returns DIRECT or BROAD using Vertex AI 2.5 Flash."""
    try:
        q_snippet = (user_query or '')
        if len(q_snippet) > 120:
            q_snippet = q_snippet[:120] + '...'
        logger.info(f"Intent classifier start: query='{q_snippet}' (Vertex AI)")
    except Exception:
        pass

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

    client = _get_vertex_client()
    models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None

    for model_name in models:
        for attempt in range(max_retries):
            try:
                print(f"🧭 Calling Intent Classifier Vertex AI ({model_name}) attempt {attempt + 1}/{max_retries}")
                
                response = client.models.generate_content(
                    model=model_name,
                    contents=intent_prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        top_k=1,
                        top_p=0.1,
                        max_output_tokens=2000,
                        response_mime_type="application/json"
                    )
                )
                print(f"🧭 Intent classifier success via {model_name}")
                
                # Mock the response dict
                data = _mock_gemini_response(response.text)
                return data
            except Exception as e:
                print(f"❌ Error in intent classifier ({model_name}): {e}")
                last_error = e
                import time
                time.sleep(1)
                
    raise last_error or Exception("All intent classifier attempts failed")

def call_gemini_api_stream(prompt):
    """Call Vertex AI with streaming enabled."""
    if not isinstance(prompt, str):
        try: prompt = str(prompt)
        except Exception: prompt = ''
        
    client = _get_vertex_client()
    models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None

    for model_name in models:
        try:
            print(f"⚡ Streaming from Vertex AI {model_name}...")
            
            response_stream = client.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    top_k=20,
                    top_p=0.8,
                    max_output_tokens=4096,
                )
            )
            
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            print(f"❌ Error streaming from Vertex AI {model_name}: {e}")
            last_error = e
            
    raise last_error or Exception("All Vertex AI streaming attempts failed")