import requests
import json
import time
import random
from django.conf import settings
from requests.exceptions import ConnectionError, Timeout, RequestException
import socket

class NetworkError(Exception):
    """Custom exception for network-related errors"""
    pass

def call_gemini_api(prompt, max_retries=5):
    """Call Gemini API with enhanced retry logic and exponential backoff for Pro model"""
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    for attempt in range(max_retries):
        try:
            print(f"🔑 Calling Gemini 1.5 Pro API (attempt {attempt + 1}/{max_retries})")
            
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
            
            response = requests.post(
                f'{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}',
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Gemini 1.5 Pro API call successful")
                return response.json()
            elif response.status_code in [429, 503]:
                # Calculate exponential backoff with jitter for overload/rate limit
                base_delay = 2 ** attempt  # 2, 4, 8, 16, 32 seconds
                jitter = random.uniform(0.5, 1.5)  # Add randomness to avoid thundering herd
                delay = min(base_delay * jitter, 60)  # Cap at 60 seconds
                
                error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:  # Don't sleep on the last attempt
                    time.sleep(delay)
                continue
            else:
                # Helpful debug for 400s
                snippet = (prompt[:200] + '...') if isinstance(prompt, str) and len(prompt) > 200 else prompt
                print(f"❌ Gemini API error {response.status_code}: {response.text}\nPayload preview: {snippet}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Short delay for other errors
                continue
                
        except (ConnectionError, Timeout, socket.gaierror) as e:
            print(f"🌐 Network connection error: {str(e)}")
            # Don't retry network errors automatically - let frontend handle it
            raise NetworkError("Network connection lost. Please check your internet connection and try again.")
        except Exception as e:
            print(f"❌ Error with Gemini API: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2)
            continue
    
    raise Exception("All Gemini API attempts failed") 

def call_gemini_flash_api(prompt, max_retries=3):
    """Call Gemini 1.5 Flash API for fast conversations - optimized for chat"""
    GEMINI_FLASH_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    network_error_count = 0
    
    for attempt in range(max_retries):
        try:
            print(f"⚡ Calling Gemini 1.5 Flash API (attempt {attempt + 1}/{max_retries})")
            
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
                    'temperature': 0.7,  # Slightly higher for more conversational responses
                    'topK': 40,
                    'topP': 0.9,
                    'maxOutputTokens': 2048,  # Lower for faster responses
                    'stopSequences': []
                }
            }
            
            response = requests.post(
                f'{GEMINI_FLASH_API_URL}?key={settings.GEMINI_API_KEY}',
                headers=headers,
                json=data,
                timeout=15  # Shorter timeout for flash model
            )
            
            if response.status_code == 200:
                print("✅ Gemini 1.5 Flash API call successful")
                return response.json()
            elif response.status_code in [429, 503]:
                # Shorter backoff for flash model
                base_delay = 1.5 ** attempt  # 1.5, 2.25, 3.375 seconds
                jitter = random.uniform(0.8, 1.2)
                delay = min(base_delay * jitter, 10)  # Cap at 10 seconds
                
                error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    time.sleep(delay)
                continue
            else:
                snippet = (prompt[:200] + '...') if isinstance(prompt, str) and len(prompt) > 200 else prompt
                print(f"❌ Gemini Flash API error {response.status_code}: {response.text}\nPayload preview: {snippet}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # Shorter delay for flash model
                continue
                
        except (ConnectionError, Timeout, socket.gaierror) as e:
            print(f"🌐 Network connection error: {str(e)}")
            # Don't retry network errors automatically - let frontend handle it
            raise NetworkError("Network connection lost. Please check your internet connection and try again.")
        except Exception as e:
            print(f"❌ Error with Gemini Flash API: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)
            continue
    
    raise Exception("All Gemini Flash API attempts failed") 

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

    # If all models fail, raise exception to trigger 1.5 Pro fallback
    raise Exception("All Gemini 2.5 Pro model variants failed")


def call_intent_classifier(user_query: str, max_retries: int = 3):
    """AI-only intent classifier: returns DIRECT or BROAD using Gemini 1.5 Pro.
    Behavior:
    - No local heuristics. Always call Gemini 1.5 Pro with a strict, example-driven prompt.
    - Returns a Gemini-shaped response JSON (contains 'candidates' with a parts[0].text JSON string).
    Uses GEMINI_CLASSIFIER_API_KEY if set, otherwise GEMINI_API_KEY.
    """
    api_key = getattr(settings, 'GEMINI_CLASSIFIER_API_KEY', None) or getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        raise Exception("Gemini classifier API key not configured")

    intent_prompt = f"""
You are an expert AI curriculum designer. Your primary task is to analyze a user's learning request and classify its scope. This classification determines whether you generate a detailed lesson on specific topics or a high-level syllabus for a broad subject.

Your goal is to classify the user's query as either DIRECT or BROAD.

## Definitions & Core Concepts

- **DIRECT**: The user requests a small, enumerable list of specific, atomic topics. These are "building blocks" of knowledge that could typically be covered in a single lesson or a short series of lessons. The query is focused and narrow.
    - **Heuristics**: Often contains connectors (commas, "and", "+"), lists, or single, well-defined acronyms/algorithms (e.g., "DFS", "RSA", "Quick Sort").

- **BROAD**: The user names a general field of study, a programming language, a framework, a high-level paradigm, or a subject that requires a full curriculum (a syllabus with multiple modules) to be properly explained. The query is open-ended and high-level.
    - **Heuristics**: Often a single phrase or noun representing a large domain (e.g., "web development", "calculus", "React").

## The Specificity Test (Critical Thinking Heuristic)

To resolve ambiguity, use this mental model: **"Is this the title of a textbook, or a chapter within it?"**
- If the query sounds like a **chapter title** (e.g., "For Loops", "CSS Flexbox", "Binary Search"), classify it as **DIRECT**.
- If the query sounds like the **title of the entire textbook** (e.g., "Python Programming", "Data Structures and Algorithms", "Machine Learning"), classify it as **BROAD**.

## Examples (with Reasoning)

- **Query**: "i want to learn python arrays and recursion and hash maps"
- **Reasoning**: This is a list of three specific data structures/concepts. Each is a "chapter" in a larger "Data Structures" book.
- **Classification**: DIRECT

- **Query**: "machine learning"
- **Reasoning**: This is a vast field of study. It is the "title of a textbook" (or an entire library). It needs to be broken down into a syllabus.
- **Classification**: BROAD

- **Query**: "rsa"
- **Reasoning**: This is a specific, well-defined cryptographic algorithm. It's a "chapter" in a cryptography book.
- **Classification**: DIRECT

- **Query**: "object-oriented programming"
- **Reasoning**: This is a high-level programming paradigm, not a single algorithm. It consists of multiple core concepts (inheritance, encapsulation, polymorphism) and would be a major section or module in a programming course. It's more than a chapter, closer to a "unit" or the book's main theme. Therefore, it requires a breakdown.
- **Classification**: BROAD

- **Query**: "React hooks"
- **Reasoning**: While "React" is BROAD, "React hooks" refers to a specific feature set and API within React (e.g., useState, useEffect). This is a "chapter" in the "React" textbook.
- **Classification**: DIRECT

## Task

Now, apply this reasoning to the following user query. Return ONLY a single, lowercase JSON object with the key "intent" and the value "direct" or "broad". Do not provide any explanation in your final output.

Query: "{user_query}"
""".strip()

    # Helper for posting to a Gemini endpoint with a specific key
    def _post_to_model(url: str, temperature: float, max_tokens: int, timeout: int = 20):
        headers = {'Content-Type': 'application/json'}
        data = {
            'contents': [{
                'parts': [{'text': intent_prompt}]
            }],
            'generationConfig': {
                'temperature': temperature,
                'topK': 20,
                'topP': 0.8,
                'maxOutputTokens': max_tokens,
                'stopSequences': []
            }
        }
        return requests.post(f"{url}?key={api_key}", headers=headers, data=json.dumps(data), timeout=timeout)

    # Use 1.5 Pro only for intent classification
    url_15_pro = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    
    models_to_try = [
        (url_15_pro, "1.5-pro")
    ]

    for model_url, model_name in models_to_try:
        for attempt in range(max_retries):
            try:
                print(f"🧭 Calling Intent Classifier ({model_name}) attempt {attempt + 1}/{max_retries}")
                
                # Standard timeout for both models
                timeout = 20
                
                r = _post_to_model(model_url, temperature=0.1, max_tokens=64, timeout=timeout)
                if r.status_code == 200:
                    print(f"🧭 Intent classifier success via {model_name}")
                    return r.json()
                elif r.status_code in [429, 503]:
                    # try mild backoff
                    time.sleep(min(1.5 ** attempt, 8))
                    continue
                elif r.status_code == 404:
                    print(f"❌ Model {model_name} not available, trying next model...")
                    break  # Try next model
                else:
                    print(f"❌ Intent classifier error {r.status_code} with {model_name}")
                    if attempt < max_retries - 1:
                        time.sleep(1)
                    continue
                    
            except (ConnectionError, Timeout, socket.gaierror) as e:
                print(f"🌐 Network/timeout error with intent classifier ({model_name}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    print(f"❌ All attempts failed for {model_name}, trying next model...")
                    break  # Try next model
            except Exception as e:
                print(f"❌ Error in intent classifier ({model_name}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    break  # Try next model

    raise Exception("All intent classifier attempts failed")